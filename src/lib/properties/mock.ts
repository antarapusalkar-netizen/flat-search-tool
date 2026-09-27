import { PropertyListingCandidate, PropertySearchParams, PropertySource } from "@/lib/properties/types";

/**
 * Used when RAPIDAPI_KEY isn't set, same fallback pattern as the memory DB
 * and the heuristic LLM mode — keeps the search UI usable in local dev
 * without a subscribed key.
 */
const SAMPLE: PropertyListingCandidate[] = [
  {
    sourceId: "sample-1",
    sourceUrl: null,
    title: "2 BHK Flat in Baner",
    address: "Baner Road, near Baner Gaon, Pune",
    area: "Baner",
    rent: 42000,
    rentIsEstimate: false,
    floor: 4,
    totalFloors: 9,
    hasLift: true,
    hasParking: true,
    bathrooms: 2,
    notes:
      "Sample listing (no RAPIDAPI_KEY configured). 2 BHK, semi-furnished, balcony facing the road, gated society with security.",
  },
  {
    sourceId: "sample-2",
    sourceUrl: null,
    title: "3 BHK Flat in Kothrud",
    address: "Kothrud Depot Road, Pune",
    area: "Kothrud",
    rent: 55000,
    rentIsEstimate: true,
    floor: 2,
    totalFloors: 4,
    hasLift: false,
    hasParking: true,
    bathrooms: 2,
    notes:
      "Sample listing (no RAPIDAPI_KEY configured). 3 BHK, unfurnished, no lift in the building, close to main road.",
  },
  {
    sourceId: "sample-3",
    sourceUrl: null,
    title: "2 BHK Flat in Hinjewadi Phase 1",
    address: "Hinjewadi Phase 1, Pune",
    area: "Hinjewadi",
    rent: 38000,
    rentIsEstimate: false,
    floor: 6,
    totalFloors: 12,
    hasLift: true,
    hasParking: false,
    bathrooms: 2,
    notes:
      "Sample listing (no RAPIDAPI_KEY configured). 2 BHK, fully furnished, no dedicated parking, walk to IT park.",
  },
];

export const mockPropertySource: PropertySource = {
  async search(params: PropertySearchParams) {
    const locality = params.locality.trim().toLowerCase();
    if (!locality) return SAMPLE;
    return SAMPLE.filter((s) => s.area.toLowerCase().includes(locality));
  },
};
