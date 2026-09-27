import {
  Constraints,
  DealbreakerResult,
  Flat,
  PersonFlatBreakdown,
} from "@/lib/types";

/**
 * Deterministic hard-requirement / dealbreaker check. This never touches the
 * LLM — dealbreakers are non-negotiable facts (budget, lift, area) and must
 * be exact, not a model's best guess.
 */
export function checkDealbreakers(
  flat: Flat,
  constraints: Constraints
): { dealbreakers: DealbreakerResult[]; rentShare: number; overBudget: boolean } {
  const dealbreakers: DealbreakerResult[] = [];
  const rentShare = Math.round(flat.rent / 3);
  const overBudget = rentShare > constraints.maxRent;

  if (overBudget) {
    dealbreakers.push({
      code: "over_budget",
      detail: `Her share (₹${rentShare.toLocaleString("en-IN")}/mo) is above her max of ₹${constraints.maxRent.toLocaleString("en-IN")}/mo.`,
    });
  }

  const noGoHit = constraints.noGoAreas.find(
    (area) => area.trim().toLowerCase() === flat.area.trim().toLowerCase()
  );
  if (noGoHit) {
    dealbreakers.push({
      code: "no_go_area",
      detail: `${flat.area} is on her no-go list.`,
    });
  }

  if (constraints.hardRequirements.lift && !flat.hasLift) {
    dealbreakers.push({ code: "no_lift", detail: "No lift, and she requires one." });
  }
  if (constraints.hardRequirements.parking && !flat.hasParking) {
    dealbreakers.push({ code: "no_parking", detail: "No parking, and she requires it." });
  }
  if (flat.bathrooms < constraints.hardRequirements.minBathrooms) {
    dealbreakers.push({
      code: "too_few_bathrooms",
      detail: `Only ${flat.bathrooms} bathroom(s); she needs at least ${constraints.hardRequirements.minBathrooms}.`,
    });
  }
  if (constraints.hardRequirements.petFriendly && !flat.petFriendly) {
    dealbreakers.push({
      code: "not_pet_friendly",
      detail: "Not pet-friendly, and she requires it.",
    });
  }

  return { dealbreakers, rentShare, overBudget };
}

export function buildHeuristicBreakdown(
  flat: Flat,
  constraints: Constraints
): PersonFlatBreakdown {
  const { dealbreakers, rentShare, overBudget } = checkDealbreakers(flat, constraints);
  const softResults = constraints.softPreferences.map((preference) => ({
    preference,
    status: "unclear" as const,
    reason: "No live LLM configured — couldn't check the listing notes for this.",
  }));
  return {
    person: constraints.person,
    dealbreakers,
    softResults,
    rentShare,
    overBudget,
    getsEverything: dealbreakers.length === 0 && softResults.length === 0,
  };
}
