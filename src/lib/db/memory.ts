import { Constraints, Flat, Person, PEOPLE } from "@/lib/types";
import { Db } from "@/lib/db/types";

// In-memory mock DB. Lives for the lifetime of the Node process — fine for
// local dev, but does NOT persist across serverless invocations, so it is
// not a substitute for Supabase in production. Kept on globalThis so it
// survives Next.js dev-mode's per-route module reloads (each API route can
// otherwise get its own fresh copy of a plain module-level variable).
interface MemoryStore {
  constraints: Map<Person, Constraints>;
  flats: Flat[];
}

const globalForStore = globalThis as unknown as { __flatSearchStore?: MemoryStore };

const store: MemoryStore =
  globalForStore.__flatSearchStore ??
  (globalForStore.__flatSearchStore = {
    constraints: new Map<Person, Constraints>(),
    flats: [],
  });

export const memoryDb: Db = {
  async getConstraints(person) {
    return store.constraints.get(person) ?? null;
  },
  async setConstraints(constraints) {
    store.constraints.set(constraints.person, constraints);
  },
  async getAllConstraints() {
    const result: Partial<Record<Person, Constraints>> = {};
    for (const person of PEOPLE) {
      const c = store.constraints.get(person);
      if (c) result[person] = c;
    }
    return result;
  },
  async listFlats() {
    return [...store.flats].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async addFlat(flat) {
    store.flats.push(flat);
  },
  async deleteFlat(id) {
    const idx = store.flats.findIndex((f) => f.id === id);
    if (idx >= 0) store.flats.splice(idx, 1);
  },
};
