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
 * Form Placement — UI-only concept for catalog filtering.
 * These values are used in frontend hooks/components to determine
 * which categories/spare-parts to load. They must NEVER appear in
 * submitted API payloads; map to LISTING_TYPE values before submission.
 *
 * Mapping:
 *   'postad'        → LISTING_TYPE.AD
 *   'postservice'   → LISTING_TYPE.SERVICE
 *   'postsparepart' → LISTING_TYPE.SPARE_PART
 */
export const FORM_PLACEMENT = {
    AD: 'postad',
    SERVICE: 'postservice',
    SPARE_PART: 'postsparepart',
} as const;

export type FormPlacement = (typeof FORM_PLACEMENT)[keyof typeof FORM_PLACEMENT];

export const FORM_PLACEMENT_VALUES = Object.values(FORM_PLACEMENT) as [FormPlacement, ...FormPlacement[]];

/**
 * To map between FormPlacement and ListingTypeValue use:
 *   import { categoryEnumToRecord, recordEnumToCategory } from 'shared/utils/listingTypeMap'
 */
