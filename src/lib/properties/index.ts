import { hasRapidApi } from "@/lib/env";
import { PropertySource } from "@/lib/properties/types";
import { mockPropertySource } from "@/lib/properties/mock";

let source: PropertySource | null = null;

export function getPropertySource(): PropertySource {
  if (source) return source;
  if (hasRapidApi) {
    const { nobrokerPropertySource } = require("@/lib/properties/nobroker") as typeof import("@/lib/properties/nobroker");
    source = nobrokerPropertySource;
  } else {
    source = mockPropertySource;
  }
  return source;
}
