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

/**
 * @deprecated Use LISTING_TYPE directly instead
 * 
 * FormPlacement was created as a UI-layer alias for form labels,
 * but creates unnecessary complexity. Prefer using LISTING_TYPE
 * (the canonical storage format) throughout the application.
 * 
 * This enum will be removed in v2.0
 * 
 * Migration:
 * - Replace 'postad' → LISTING_TYPE.AD
 * - Replace 'postservice' → LISTING_TYPE.SERVICE
 * - Replace 'postsparepart' → LISTING_TYPE.SPARE_PART
 * 
 * @see LISTING_TYPE
 */
export const FORM_PLACEMENT = {
    /** @deprecated Use LISTING_TYPE.AD */
    AD: 'postad',
    /** @deprecated Use LISTING_TYPE.SERVICE */
    SERVICE: 'postservice',
    /** @deprecated Use LISTING_TYPE.SPARE_PART */
    SPARE_PART: 'postsparepart',
} as const;

/**
 * @deprecated Use ListingTypeValue instead
 * See FormPlacement deprecation notice above
 */
export type FormPlacement = (typeof FORM_PLACEMENT)[keyof typeof FORM_PLACEMENT];

/**
 * @deprecated Use LISTING_TYPE_VALUES instead
 * See FormPlacement deprecation notice above
 */
export const FORM_PLACEMENT_VALUES = Object.values(FORM_PLACEMENT) as [FormPlacement, ...FormPlacement[]];

/**
 * To map between FormPlacement and ListingTypeValue use:
 * @deprecated - Use LISTING_TYPE values directly instead
 *   import { categoryEnumToRecord, recordEnumToCategory } from 'shared/utils/listingTypeMap'
 */
