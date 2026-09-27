import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { analyzeFlat } from "@/lib/llm";
import { PEOPLE } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const [flats, allConstraints] = await Promise.all([
    db.listFlats(),
    db.getAllConstraints(),
  ]);

  const allSubmitted = PEOPLE.every((person) => Boolean(allConstraints[person]));
  if (!allSubmitted) {
    return NextResponse.json(
      { ready: false, missing: PEOPLE.filter((p) => !allConstraints[p]) },
      { status: 200 }
    );
  }

  const comparisons = await Promise.all(
    flats.map((flat) => analyzeFlat(flat, allConstraints))
  );

  return NextResponse.json({ ready: true, comparisons });
}
