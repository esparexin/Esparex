/**
 * listingTypeMap — Central SSOT for listing type enum translation.
 *
 * Two parallel enum systems exist in the codebase:
 *   Category / UI placement:  'postad' | 'postservice' | 'postsparepart'  (FormPlacement)
 *   Ad record discriminator:  'ad'     | 'service'     | 'spare_part'     (ListingTypeValue)
 *
 * All code that crosses this boundary MUST use these helpers.
 * Do NOT write manual string comparisons like (type === 'postservice' ? 'service' : type).
 */

import {
    FORM_PLACEMENT,
    LISTING_TYPE,
    type FormPlacement,
    type ListingTypeValue,
} from '../enums/listingType';

/** Category placement → Ad record discriminator */
export const CATEGORY_ENUM_TO_RECORD: Record<FormPlacement, ListingTypeValue> = {
    [FORM_PLACEMENT.AD]:         LISTING_TYPE.AD,
    [FORM_PLACEMENT.SERVICE]:    LISTING_TYPE.SERVICE,
    [FORM_PLACEMENT.SPARE_PART]: LISTING_TYPE.SPARE_PART,
} as const;

/** Ad record discriminator → Category placement */
export const RECORD_ENUM_TO_CATEGORY: Record<ListingTypeValue, FormPlacement> = {
    [LISTING_TYPE.AD]:         FORM_PLACEMENT.AD,
    [LISTING_TYPE.SERVICE]:    FORM_PLACEMENT.SERVICE,
    [LISTING_TYPE.SPARE_PART]: FORM_PLACEMENT.SPARE_PART,
} as const;

// Type aliases — import FormPlacement / ListingTypeValue from enums directly for new code.
/** @deprecated Use FormPlacement from shared/enums/listingType */
export type CategoryListingType = FormPlacement;
/** @deprecated Use ListingTypeValue from shared/enums/listingType */
export type RecordListingType = ListingTypeValue;

/**
 * Convert a Category-level placement (used in catalog filters)
 * to the Ad record discriminator (used in the Ad collection).
 *
 * @example categoryEnumToRecord('postsparepart') // → 'spare_part'
 */
export function categoryEnumToRecord(categoryType: string): ListingTypeValue {
    return (CATEGORY_ENUM_TO_RECORD as Record<string, ListingTypeValue>)[categoryType] ?? LISTING_TYPE.AD;
}

/**
 * Convert an Ad record listingType to its Category-level equivalent.
 *
 * @example recordEnumToCategory('service') // → 'postservice'
 */
export function recordEnumToCategory(recordType: string): FormPlacement {
    return (RECORD_ENUM_TO_CATEGORY as Record<string, FormPlacement>)[recordType] ?? FORM_PLACEMENT.AD;
}

/**
 * Human-readable label for a record-level listing type.
 */
export function listingTypeLabel(recordType: string): string {
    const labels: Record<ListingTypeValue, string> = {
        [LISTING_TYPE.AD]:         'Ad',
        [LISTING_TYPE.SERVICE]:    'Service',
        [LISTING_TYPE.SPARE_PART]: 'Spare Part',
    };
    return labels[recordType as ListingTypeValue] ?? recordType;
}
