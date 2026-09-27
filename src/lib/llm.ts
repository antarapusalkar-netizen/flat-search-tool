import OpenAI from "openai";
import { hasOpenAI } from "@/lib/env";
import { checkDealbreakers } from "@/lib/compare";
import {
  Constraints,
  Flat,
  FlatComparison,
  Person,
  PersonFlatBreakdown,
  SoftPrefResult,
} from "@/lib/types";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

function heuristicSoftResults(preferences: string[]): SoftPrefResult[] {
  return preferences.map((preference) => ({
    preference,
    status: "unclear" as const,
    reason: "No live LLM configured — couldn't check the listing notes for this.",
  }));
}

function heuristicNarrative(flat: Flat, perPerson: PersonFlatBreakdown[]): string {
  const lines = perPerson.map((p) => {
    if (p.dealbreakers.length > 0) {
      return `${p.person[0].toUpperCase()}${p.person.slice(1)}: dealbreaker — ${p.dealbreakers
        .map((d) => d.detail)
        .join(" ")}`;
    }
    return `${p.person[0].toUpperCase()}${p.person.slice(1)}: no dealbreakers on rent, area, or hard requirements.`;
  });
  return lines.join(" ");
}

/**
 * The rule engine handles hard requirements deterministically (never
 * hallucinated). The LLM's only job is the fuzzy part: reading the flat's
 * free-text notes and judging whether each person's soft (non-dealbreaker)
 * preferences seem satisfied — plus writing one neutral paragraph. It never
 * ranks people or declares which flat is "best".
 */
export async function analyzeFlat(
  flat: Flat,
  constraintsByPerson: Partial<Record<Person, Constraints>>
): Promise<FlatComparison> {
  const people = Object.values(constraintsByPerson).filter(Boolean) as Constraints[];

  const base = people.map((c) => {
    const { dealbreakers, rentShare, overBudget } = checkDealbreakers(flat, c);
    return { constraints: c, dealbreakers, rentShare, overBudget };
  });

  if (!hasOpenAI) {
    const perPerson: PersonFlatBreakdown[] = base.map((b) => {
      const softResults = heuristicSoftResults(b.constraints.softPreferences);
      return {
        person: b.constraints.person,
        dealbreakers: b.dealbreakers,
        softResults,
        rentShare: b.rentShare,
        overBudget: b.overBudget,
        getsEverything: b.dealbreakers.length === 0 && softResults.length === 0,
      };
    });
    return {
      flat,
      perPerson,
      narrative: heuristicNarrative(flat, perPerson),
      narrativeSource: "heuristic",
    };
  }

  const prompt = {
    flat: {
      name: flat.name,
      address: flat.address,
      area: flat.area,
      rent: flat.rent,
      floor: flat.floor,
      hasLift: flat.hasLift,
      hasParking: flat.hasParking,
      bathrooms: flat.bathrooms,
      petFriendly: flat.petFriendly,
      notes: flat.notes,
    },
    people: base.map((b) => ({
      person: b.constraints.person,
      hasDealbreakers: b.dealbreakers.length > 0,
      softPreferences: b.constraints.softPreferences,
    })),
  };

  const system = `You help three flatmates compare a candidate flat against each person's soft
(nice-to-have, non-dealbreaker) preferences, based only on the flat's free-text notes.
For each person, for each of her soft preferences, decide: "met" (notes clearly support it),
"compromise" (notes clearly contradict or omit something she cares about), or "unclear"
(can't tell from the notes). Never invent details not in the notes.
Then write one short neutral paragraph (2-3 sentences) summarizing the tradeoffs across all
three people for this flat. Never rank the people, never declare a "winner" or best person,
never make the decision for them — just describe who is compromising on what, plainly.
Respond with strict JSON only, matching this shape:
{"people": [{"person": "riya", "softResults": [{"preference": "...", "status": "met|compromise|unclear", "reason": "..."}]}], "narrative": "..."}`;

  try {
    const completion = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(prompt) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      people: { person: Person; softResults: SoftPrefResult[] }[];
      narrative: string;
    };

    const softByPerson = new Map(parsed.people.map((p) => [p.person, p.softResults]));

    const perPerson: PersonFlatBreakdown[] = base.map((b) => {
      const softResults =
        softByPerson.get(b.constraints.person) ??
        heuristicSoftResults(b.constraints.softPreferences);
      return {
        person: b.constraints.person,
        dealbreakers: b.dealbreakers,
        softResults,
        rentShare: b.rentShare,
        overBudget: b.overBudget,
        getsEverything:
          b.dealbreakers.length === 0 && softResults.every((s) => s.status === "met"),
      };
    });

    return {
      flat,
      perPerson,
      narrative: parsed.narrative || heuristicNarrative(flat, perPerson),
      narrativeSource: "llm",
    };
  } catch {
    const perPerson: PersonFlatBreakdown[] = base.map((b) => {
      const softResults = heuristicSoftResults(b.constraints.softPreferences);
      return {
        person: b.constraints.person,
        dealbreakers: b.dealbreakers,
        softResults,
        rentShare: b.rentShare,
        overBudget: b.overBudget,
        getsEverything: b.dealbreakers.length === 0 && softResults.length === 0,
      };
    });
    return {
      flat,
      perPerson,
      narrative: heuristicNarrative(flat, perPerson),
      narrativeSource: "heuristic",
    };
  }
}
