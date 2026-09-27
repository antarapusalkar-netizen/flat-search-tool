# Flat Search — compromise, not conflict

Riya, Meera, and Kavita each fill in their own rent cap, no-go areas, hard
requirements, and soft preferences — privately. Then they search NoBroker for
candidate flats (or paste one in by hand), and the tool shows, for each flat,
who gets everything, who's compromising, and on exactly what. It never picks a
flat for them.

See [CLAUDE.md](./CLAUDE.md) for the full spec.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `.env.local`, everything runs on an
in-memory mock DB and a heuristic (non-LLM) fallback for soft-preference
matching, so the full flow — intake → add flats → compare — works out of the
box for development.

## Wiring up the real integrations

Copy `.env.local.example` to `.env.local` and fill in:

- **`SUPABASE_URL`** / **`SUPABASE_SERVICE_ROLE_KEY`** — run
  `supabase/schema.sql` in your project's SQL editor once, then set these.
  The service role key is only ever read server-side, inside API routes.
  Required for anything entered to survive across requests once deployed
  (serverless functions don't share memory the way `npm run dev` does).
- **`OPENAI_API_KEY`** — reads each flat's free-text notes and judges whether
  a person's soft preferences ("balcony", "close to metro", ...) seem met,
  and writes one neutral tradeoff paragraph per flat. Hard dealbreakers
  (budget, lift, area, bathrooms, pet policy) are always checked with plain
  deterministic code, never left to the model — see `src/lib/compare.ts`.
- **`RAPIDAPI_KEY`** / **`RAPIDAPI_HOST`** — powers the "Search NoBroker" panel
  on the flats page. Subscribe (free tier) at
  [rapidapi.com/otomo-takozo/api/nobroker-api](https://rapidapi.com/otomo-takozo/api/nobroker-api)
  and copy the key from the Playground's code snippet. Without it, search
  returns a few sample Pune listings instead of live ones. Either way,
  results are drafts — you confirm every field (NoBroker's data never
  reports pet policy) before a listing becomes a real candidate flat.

## Architecture

```
src/lib/
  types.ts        shared domain types
  db/             Db interface + Supabase impl + in-memory mock impl
  properties/     PropertySource interface + NoBroker impl + sample-data mock
  compare.ts       deterministic hard-requirement / dealbreaker checks
  llm.ts           soft-preference matching + narrative (+ heuristic fallback)
src/app/
  intake/[person]/  private constraint form (riya / meera / kavita)
  flats/            NoBroker search + manual flat entry + list
  compare/          side-by-side comparison (locked until all 3 submit)
  api/              REST endpoints the pages above call (incl. api/search)
```

## Deploying

Push to GitHub, then import the repo in the Vercel dashboard. Add the same
env vars from `.env.local` under Project Settings → Environment Variables
before your first deploy (or redeploy after adding them).
