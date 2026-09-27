import http2 from "node:http2";
import { PropertyListingCandidate, PropertySearchParams, PropertySource } from "@/lib/properties/types";

const API_ORIGIN = "https://nobroker-api.p.rapidapi.com";
const API_PATH = "/scrapers/api/nobroker/property/listing-by-url";

/**
 * This RapidAPI endpoint's edge only accepts HTTP/2 (curl's `--http2`
 * negotiates fine; `fetch`/undici, which is HTTP/1.1-only, hangs until the
 * server resets the connection). Node's `http2` module is the only client in
 * the runtime that actually completes the handshake it negotiates via ALPN.
 */
function postJson(origin: string, path: string, headers: Record<string, string>, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(origin);
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("NoBroker listings API timed out"));
    }, 15000);

    client.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    const req = client.request({
      ":method": "POST",
      ":path": path,
      "content-type": "application/json",
      ...headers,
    });

    let responseBody = "";
    let status = 200;
    req.on("response", (resHeaders) => {
      status = Number(resHeaders[":status"] ?? 200);
    });
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      responseBody += chunk;
    });
    req.on("end", () => {
      clearTimeout(timeout);
      client.close();
      if (status >= 400) {
        reject(new Error(`NoBroker listings API returned ${status}`));
        return;
      }
      resolve(responseBody);
    });
    req.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Builds a real nobroker.in search-page URL. Verified live on nobroker.in:
 * "/flats-for-rent-in-pune", "/flats-for-rent-in-baner_pune", and the
 * "<n>bhk-" prefix (e.g. "/3bhk-flats-for-rent-in-baner_pune") all resolve
 * to the expected filtered search page.
 */
export function buildSearchUrl(params: PropertySearchParams): string {
  const city = slugify(params.city);
  const localitySlug = params.locality.trim() ? `${slugify(params.locality)}_${city}` : city;
  const bhkPrefix = params.bhk && params.bhk > 0 ? `${params.bhk}bhk-` : "";
  return `https://www.nobroker.in/${bhkPrefix}flats-for-rent-in-${localitySlug}`;
}

// The scraped payload has ~90 loosely-typed fields; we only pull what we need
// and treat everything as possibly absent.
interface RawListing {
  id?: string;
  short_url?: string;
  detail_url?: string;
  property_title?: string;
  address?: string;
  locality?: string;
  nb_locality?: string;
  city?: string;
  rent?: number;
  price?: number;
  expected_rent?: number;
  property_type?: string;
  floor?: number;
  total_floor?: number;
  bathroom?: number;
  lift?: boolean;
  parking?: string;
  furnishing?: string;
  facing_desc?: string;
  society?: string;
  type_desc?: string;
  negotiable?: boolean;
  amenities_map?: Record<string, boolean>;
}

function toCandidate(raw: RawListing): PropertyListingCandidate {
  const isRentListing = raw.property_type === "RENT";
  const rent =
    typeof raw.rent === "number"
      ? raw.rent
      : isRentListing && typeof raw.price === "number"
        ? raw.price
        : null;
  const rentIsEstimate = rent === null && typeof raw.expected_rent === "number";

  const hasLift = typeof raw.lift === "boolean" ? raw.lift : raw.amenities_map?.LIFT ?? null;
  const hasParking =
    typeof raw.parking === "string"
      ? raw.parking.trim().length > 0 && raw.parking.toUpperCase() !== "NONE"
      : raw.amenities_map?.PARK ?? null;

  const amenityNotes = raw.amenities_map
    ? Object.entries(raw.amenities_map)
        .filter(([, v]) => v)
        .map(([k]) => k.toLowerCase())
        .join(", ")
    : "";

  const notes = [
    raw.type_desc,
    raw.furnishing && `${raw.furnishing.replace(/_/g, " ").toLowerCase()}`,
    raw.facing_desc && `${raw.facing_desc} facing`,
    raw.society && `society: ${raw.society}`,
    amenityNotes && `amenities: ${amenityNotes}`,
    "Auto-imported from NoBroker — pet policy isn't in the source data, confirm it before adding.",
  ]
    .filter(Boolean)
    .join(". ");

  return {
    sourceId: raw.id ?? raw.short_url ?? crypto.randomUUID(),
    sourceUrl: raw.short_url ?? (raw.detail_url ? `https://www.nobroker.in${raw.detail_url}` : null),
    title: raw.property_title ?? "Untitled listing",
    address: raw.address ?? "",
    area: raw.locality ?? raw.nb_locality ?? raw.city ?? "",
    rent: rent ?? (rentIsEstimate ? Math.round(raw.expected_rent as number) : null),
    rentIsEstimate,
    floor: typeof raw.floor === "number" ? raw.floor : null,
    totalFloors: typeof raw.total_floor === "number" ? raw.total_floor : null,
    hasLift,
    hasParking,
    bathrooms: typeof raw.bathroom === "number" ? raw.bathroom : null,
    notes,
  };
}

export const nobrokerPropertySource: PropertySource = {
  async search(params: PropertySearchParams): Promise<PropertyListingCandidate[]> {
    const url = buildSearchUrl(params);
    const host = process.env.RAPIDAPI_HOST || "nobroker-api.p.rapidapi.com";

    const raw = await postJson(
      API_ORIGIN,
      API_PATH,
      {
        "x-rapidapi-host": host,
        "x-rapidapi-key": process.env.RAPIDAPI_KEY as string,
      },
      JSON.stringify({ url })
    );

    const body = JSON.parse(raw) as { statusCode?: number; data?: RawListing[] };
    if (!Array.isArray(body.data)) return [];
    return body.data.slice(0, 20).map(toCandidate);
  },
};
