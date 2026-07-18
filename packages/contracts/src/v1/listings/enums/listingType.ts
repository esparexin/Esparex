/**
 * Listing Type Enum — Global SSOT for marketplace entity classification.
 * Values are lowercase strings that match DB field values exactly.
 */

export const LISTING_TYPE = {
    AD: 'ad',
    SERVICE: 'service',
    SPARE_PART: 'spare_part',
} as const;

export type ListingTypeValue = (typeof LISTING_TYPE)[keyof typeof LISTING_TYPE];

/** Tuple of all valid listing type values — use with z.enum() */
export const LISTING_TYPE_VALUES = Object.values(LISTING_TYPE) as [ListingTypeValue, ...ListingTypeValue[]];
