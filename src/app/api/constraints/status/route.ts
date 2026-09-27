import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PEOPLE } from "@/lib/types";

// Deliberately returns only submitted/not-submitted, never the contents —
// constraints stay private until every one of the three has submitted.
export async function GET() {
  const all = await getDb().getAllConstraints();
  const status = Object.fromEntries(
    PEOPLE.map((person) => [person, Boolean(all[person])])
  );
  const allSubmitted = PEOPLE.every((person) => status[person]);
  return NextResponse.json({ status, allSubmitted });
}
