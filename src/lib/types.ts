export type Person = "riya" | "meera" | "kavita";

export const PEOPLE: Person[] = ["riya", "meera", "kavita"];

export const PERSON_LABEL: Record<Person, string> = {
  riya: "Riya",
  meera: "Meera",
  kavita: "Kavita",
};

export interface HardRequirements {
  lift: boolean;
  parking: boolean;
  minBathrooms: number;
  petFriendly: boolean;
}

export interface Constraints {
  person: Person;
  maxRent: number;
  noGoAreas: string[];
  hardRequirements: HardRequirements;
  softPreferences: string[];
  submittedAt: string;
}

export interface Flat {
  id: string;
  name: string;
  address: string;
  area: string;
  rent: number;
  floor: number;
  hasLift: boolean;
  hasParking: boolean;
  bathrooms: number;
  petFriendly: boolean;
  notes: string;
  createdAt: string;
}

export type SoftPrefStatus = "met" | "compromise" | "unclear";

export interface SoftPrefResult {
  preference: string;
  status: SoftPrefStatus;
  reason: string;
}

export interface DealbreakerResult {
  code: string;
  detail: string;
}

export interface PersonFlatBreakdown {
  person: Person;
  dealbreakers: DealbreakerResult[];
  softResults: SoftPrefResult[];
  rentShare: number;
  overBudget: boolean;
  getsEverything: boolean;
}

export interface FlatComparison {
  flat: Flat;
  perPerson: PersonFlatBreakdown[];
  narrative: string;
  narrativeSource: "llm" | "heuristic";
}
