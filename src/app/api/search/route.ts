import { NextRequest, NextResponse } from "next/server";
import { getPropertySource } from "@/lib/properties";
import { hasRapidApi } from "@/lib/env";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const city = String(body.city ?? "").trim();
  const locality = String(body.locality ?? "").trim();
  const bhk = body.bhk ? Number(body.bhk) : undefined;

  if (!city) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  try {
    const candidates = await getPropertySource().search({ city, locality, bhk });
    return NextResponse.json({ candidates, live: hasRapidApi });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Listings search failed" },
      { status: 502 }
    );
  }
}
