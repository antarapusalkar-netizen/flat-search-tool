import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { Flat } from "@/lib/types";

export async function GET() {
  const flats = await getDb().listFlats();
  return NextResponse.json({ flats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const rent = Number(body.rent);
  const floor = Number(body.floor ?? 0);
  const bathrooms = Number(body.bathrooms);
  if (!body.name || !body.area || !Number.isFinite(rent) || rent <= 0) {
    return NextResponse.json(
      { error: "name, area, and a positive rent are required" },
      { status: 400 }
    );
  }

  const flat: Flat = {
    id: randomUUID(),
    name: String(body.name),
    address: String(body.address ?? ""),
    area: String(body.area),
    rent,
    floor: Number.isFinite(floor) ? floor : 0,
    hasLift: Boolean(body.hasLift),
    hasParking: Boolean(body.hasParking),
    bathrooms: Number.isFinite(bathrooms) ? bathrooms : 1,
    petFriendly: Boolean(body.petFriendly),
    notes: String(body.notes ?? ""),
    createdAt: new Date().toISOString(),
  };

  await getDb().addFlat(flat);
  return NextResponse.json({ flat });
}
