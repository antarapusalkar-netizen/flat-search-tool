import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Constraints, PEOPLE, Person } from "@/lib/types";

function isPerson(value: string): value is Person {
  return (PEOPLE as string[]).includes(value);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ person: string }> }
) {
  const { person } = await params;
  if (!isPerson(person)) {
    return NextResponse.json({ error: "Unknown person" }, { status: 404 });
  }
  const constraints = await getDb().getConstraints(person);
  return NextResponse.json({ constraints });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ person: string }> }
) {
  const { person } = await params;
  if (!isPerson(person)) {
    return NextResponse.json({ error: "Unknown person" }, { status: 404 });
  }

  const body = await req.json();

  const maxRent = Number(body.maxRent);
  if (!Number.isFinite(maxRent) || maxRent <= 0) {
    return NextResponse.json({ error: "maxRent must be a positive number" }, { status: 400 });
  }
  const minBathrooms = Number(body.hardRequirements?.minBathrooms ?? 1);

  const constraints: Constraints = {
    person,
    maxRent,
    noGoAreas: Array.isArray(body.noGoAreas)
      ? body.noGoAreas.map(String).filter(Boolean)
      : [],
    hardRequirements: {
      lift: Boolean(body.hardRequirements?.lift),
      parking: Boolean(body.hardRequirements?.parking),
      minBathrooms: Number.isFinite(minBathrooms) ? minBathrooms : 1,
      petFriendly: Boolean(body.hardRequirements?.petFriendly),
    },
    softPreferences: Array.isArray(body.softPreferences)
      ? body.softPreferences.map(String).filter(Boolean)
      : [],
    submittedAt: new Date().toISOString(),
  };

  await getDb().setConstraints(constraints);
  return NextResponse.json({ constraints });
}
