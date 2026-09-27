import { hasSupabase } from "@/lib/env";
import { Db } from "@/lib/db/types";
import { memoryDb } from "@/lib/db/memory";

let db: Db | null = null;

export function getDb(): Db {
  if (db) return db;
  if (hasSupabase) {
    // Loaded lazily so the memory-only path never touches @supabase/supabase-js.
    const { supabaseDb } = require("@/lib/db/supabase") as typeof import("@/lib/db/supabase");
    db = supabaseDb;
  } else {
    db = memoryDb;
  }
  return db;
}
