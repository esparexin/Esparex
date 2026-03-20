/**
 * listingTypeMap — Central SSOT for listing type enum translation.
 *
 * Two parallel enum systems exist in the codebase:
 *   Category capability: 'postad' | 'postservice' | 'postsparepart'
 *   Ad record:           'ad'     | 'service'      | 'spare_part'
 *
 * All code that crosses this boundary MUST use these helpers.
 * Do NOT write manual string comparisons like (type === 'postservice' ? 'postad' : type).
 */

export const CATEGORY_ENUM_TO_RECORD = {
    postad:        'ad',
    postservice:   'service',
    postsparepart: 'spare_part',
} as const;

export const RECORD_ENUM_TO_CATEGORY = {
    ad:         'postad',
    service:    'postservice',
    spare_part: 'postsparepart',
} as const;

export type CategoryListingType = keyof typeof CATEGORY_ENUM_TO_RECORD;
export type RecordListingType   = keyof typeof RECORD_ENUM_TO_CATEGORY;

/**
 * Convert a Category-level listingType (used in catalog filters)
 * to the Ad record discriminator (used in the Ad collection).
 *
 * @example categoryEnumToRecord('postsparepart') // → 'spare_part'
 */
export function categoryEnumToRecord(categoryType: string): RecordListingType {
    return (CATEGORY_ENUM_TO_RECORD as Record<string, RecordListingType>)[categoryType] ?? 'ad';
}

/**
 * Convert an Ad record listingType to its Category-level equivalent.
 *
 * @example recordEnumToCategory('service') // → 'postservice'
 */
export function recordEnumToCategory(recordType: string): CategoryListingType {
    return (RECORD_ENUM_TO_CATEGORY as Record<string, CategoryListingType>)[recordType] ?? 'postad';
}

/**
 * Human-readable label for a record-level listing type.
 */
export function listingTypeLabel(recordType: string): string {
    const labels: Record<string, string> = {
        ad:         'Ad',
        service:    'Service',
        spare_part: 'Spare Part',
    };
    return labels[recordType] ?? recordType;
}
