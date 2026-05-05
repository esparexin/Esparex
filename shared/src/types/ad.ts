import type { Ad as SchemaAd } from "../schemas/ad.schema";

/**
 * Shared Ad contract.
 * SSOT: derived from shared/schemas/ad.schema.ts to prevent schema/type drift.
 */
export type Ad = SchemaAd;

/**
 * Convenience alias for location payload carried by Ad.
 */
export type AdLocation = SchemaAd["location"];
