export interface PropertySearchParams {
  city: string;
  locality: string;
  bhk?: number;
}

/**
 * A raw candidate pulled from a listings source. Deliberately not a `Flat` —
 * NoBroker's data never reports pet policy, and rent/bathrooms/lift can be
 * missing or unreliable, so a person has to review and confirm every field
 * before it becomes a real Flat that dealbreaker checks run against.
 */
export interface PropertyListingCandidate {
  sourceId: string;
  sourceUrl: string | null;
  title: string;
  address: string;
  area: string;
  rent: number | null;
  rentIsEstimate: boolean;
  floor: number | null;
  totalFloors: number | null;
  hasLift: boolean | null;
  hasParking: boolean | null;
  bathrooms: number | null;
  notes: string;
}

export interface PropertySource {
  search(params: PropertySearchParams): Promise<PropertyListingCandidate[]>;
}
