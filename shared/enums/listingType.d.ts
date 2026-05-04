/**
 * Listing Type Enum — Global SSOT for marketplace entity classification.
 * Values are lowercase strings that match DB field values exactly.
 */
export declare const LISTING_TYPE: {
    readonly AD: "ad";
    readonly SERVICE: "service";
    readonly SPARE_PART: "spare_part";
};
export type ListingTypeValue = (typeof LISTING_TYPE)[keyof typeof LISTING_TYPE];
/** Tuple of all valid listing type values — use with z.enum() */
export declare const LISTING_TYPE_VALUES: [ListingTypeValue, ...ListingTypeValue[]];
//# sourceMappingURL=listingType.d.ts.map