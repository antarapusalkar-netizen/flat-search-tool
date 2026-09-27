# Project Spec: Flat-Search Compromise Tool

## Context

Three friends — Riya, Meera, and Kavita — have been trying to find a shared flat for four months with zero shortlisted options. Every listing that gets found dies the same way: someone gets excited about it, then a dealbreaker surfaces *after* attachment, in a group WhatsApp thread, one objection at a time. Past failures:

- A 3BHK in Baner — killed by Kavita's commute to Hinjewadi (+45 min each way)
- A flat in Kothrud — killed by Riya's rule of staying within 20 min of her gym/family
- A flat with no lift, 5th floor — killed by Meera's knee condition

The actual problem isn't finding listings — there are plenty. The problem is that nobody has mapped out needs vs. preferences vs. dealbreakers *before* looking at listings, so conflicts surface late and personally, causing defensiveness and guilt.

## What this tool does NOT do

It does **not** pick a flat for the group. The three friends make the final decision together.

It does **not** trust a listings source blindly. NoBroker's scraped data never reports pet policy, and rent/bathrooms/lift can be missing or unreliable — every searched listing lands as a draft that a person must review and confirm before it becomes a real candidate flat that dealbreaker checks run against. Manual paste-in entry stays fully supported alongside search.

## What this tool DOES do

1. **Separate intake form** — each of the three fills in her own constraints privately (not visible to the others until the comparison stage):
   - Max rent contribution
   - No-go areas
   - Hard requirements (lift, parking, number of bathrooms, pet-friendly, etc.)
   - Soft preferences (nice-to-haves, not dealbreakers)

2. **Flat entry** — via NoBroker listings search (`src/lib/properties/`, city/locality/BHK in, a reviewable draft out) or by pasting in details of a flat found by hand. Either path ends the same way: a person confirms the fields before it's added.

3. **Comparison engine** — for each flat entered, checks it against all three people's stored constraints and produces a clear breakdown:
   - Who gets everything they wanted
   - Who is compromising, and on exactly what
   - Any hard dealbreaker triggered (flagged clearly, not buried)

4. **Output** — a side-by-side view across 2–3 candidate flats so the group's conversation is about *which tradeoff they're willing to accept*, not about re-litigating whether a flat qualifies at all.

## Design principles (do not violate)

- Constraints are owned individually — never blend three people's inputs into one anonymous pool.
- The tool never ranks people, assigns blame, or declares a "winner" preference — it shows tradeoffs neutrally.
- The tool never makes the final call — the group decides.
- Constraints stay private until the comparison view — no live/real-time reveal of one person's input to another.

## Stack (as built)

- Next.js 15 (App Router, TypeScript), deployed to Vercel.
- Database: Supabase (Postgres) — `constraints` + `flats` tables, see `supabase/schema.sql`. Falls back to an in-memory mock when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` aren't set (dev-only; does not persist across serverless invocations).
- Listings search: NoBroker, via the RapidAPI wrapper at `nobroker-api.p.rapidapi.com` (`src/lib/properties/nobroker.ts`), gated behind `RAPIDAPI_KEY`. Falls back to a handful of sample Pune listings (`src/lib/properties/mock.ts`) when unset. Searched listings are drafts only — never written to `flats` until a person confirms them via the "Add a flat" form.
- LLM: OpenAI (`gpt-4o-mini`), used **only** for the fuzzy part — judging whether a flat's free-text notes satisfy each person's soft preferences, and writing one neutral tradeoff paragraph. Hard dealbreakers (budget, lift, area, bathrooms, pet policy) are checked with plain deterministic code in `src/lib/compare.ts`, never left to the model. Falls back to a heuristic (non-LLM) mode when `OPENAI_API_KEY` isn't set.
- No login: each person's intake lives at `/intake/riya`, `/intake/meera`, `/intake/kavita`. Trust-based, matching this course's other mini-projects — not a real auth boundary.
