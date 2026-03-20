/**
 * Listing Type Enum — Global SSOT for marketplace entity classification.
 */

export const LISTING_TYPE = {
    AD: 'AD',
    SPARE_PART: 'SPARE_PART',
    SERVICE: 'SERVICE',
} as const;

export type ListingTypeValue = (typeof LISTING_TYPE)[keyof typeof LISTING_TYPE];

/** Tuple of all valid listing type values */
export const LISTING_TYPE_VALUES = Object.values(LISTING_TYPE) as [ListingTypeValue, ...ListingTypeValue[]];
