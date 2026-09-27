import { createClient } from "@supabase/supabase-js";
import { Constraints, Flat, Person, PEOPLE } from "@/lib/types";
import { Db } from "@/lib/db/types";

const client = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type ConstraintsRow = {
  person: Person;
  max_rent: number;
  no_go_areas: string[];
  hard_requirements: Constraints["hardRequirements"];
  soft_preferences: string[];
  submitted_at: string;
};

type FlatRow = {
  id: string;
  name: string;
  address: string;
  area: string;
  rent: number;
  floor: number;
  has_lift: boolean;
  has_parking: boolean;
  bathrooms: number;
  pet_friendly: boolean;
  notes: string;
  created_at: string;
};

function rowToConstraints(row: ConstraintsRow): Constraints {
  return {
    person: row.person,
    maxRent: row.max_rent,
    noGoAreas: row.no_go_areas ?? [],
    hardRequirements: row.hard_requirements,
    softPreferences: row.soft_preferences ?? [],
    submittedAt: row.submitted_at,
  };
}

function rowToFlat(row: FlatRow): Flat {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    area: row.area,
    rent: row.rent,
    floor: row.floor,
    hasLift: row.has_lift,
    hasParking: row.has_parking,
    bathrooms: row.bathrooms,
    petFriendly: row.pet_friendly,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

export const supabaseDb: Db = {
  async getConstraints(person) {
    const { data, error } = await client
      .from("constraints")
      .select("*")
      .eq("person", person)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToConstraints(data as ConstraintsRow) : null;
  },

  async setConstraints(constraints) {
    const { error } = await client.from("constraints").upsert(
      {
        person: constraints.person,
        max_rent: constraints.maxRent,
        no_go_areas: constraints.noGoAreas,
        hard_requirements: constraints.hardRequirements,
        soft_preferences: constraints.softPreferences,
        submitted_at: constraints.submittedAt,
      },
      { onConflict: "person" }
    );
    if (error) throw error;
  },

  async getAllConstraints() {
    const { data, error } = await client.from("constraints").select("*");
    if (error) throw error;
    const result: Partial<Record<Person, Constraints>> = {};
    for (const row of (data ?? []) as ConstraintsRow[]) {
      if (PEOPLE.includes(row.person)) result[row.person] = rowToConstraints(row);
    }
    return result;
  },

  async listFlats() {
    const { data, error } = await client
      .from("flats")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => rowToFlat(row as FlatRow));
  },

  async addFlat(flat) {
    const { error } = await client.from("flats").insert({
      id: flat.id,
      name: flat.name,
      address: flat.address,
      area: flat.area,
      rent: flat.rent,
      floor: flat.floor,
      has_lift: flat.hasLift,
      has_parking: flat.hasParking,
      bathrooms: flat.bathrooms,
      pet_friendly: flat.petFriendly,
      notes: flat.notes,
      created_at: flat.createdAt,
    });
    if (error) throw error;
  },

  async deleteFlat(id) {
    const { error } = await client.from("flats").delete().eq("id", id);
    if (error) throw error;
  },
};
