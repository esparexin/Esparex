import { CatalogFacade } from '@esparex/shared';

const DEFAULT_CANONICAL_SLUG_ALIASES: Record<string, string> = {
    'mobile-phones': 'mobiles',
    'smartphones': 'mobiles',
    'mobile-devices': 'mobiles',
    'laptop': 'laptops',
    'tablet': 'tablets',
    'ipad': 'tablets',
    'tv': 'led-tvs',
    'smart-tv': 'led-tvs',
    'led-tv': 'led-tvs',
};

export const CANONICAL_SLUG_MAPPING =
    CatalogFacade?.category?.normalize?.CANONICAL_CATEGORY_SLUG_ALIASES ?? DEFAULT_CANONICAL_SLUG_ALIASES;

/**
 * Returns the canonical slug for a given category input.
 * Delegates to CatalogFacade in @esparex/shared to eliminate duplicate mapping drift.
 */
export function getCanonicalCategorySlug(slug: string): string {
    if (!slug) return '';
    const canonical = CatalogFacade?.category?.normalize?.canonicalizeCategorySlug(slug);
    if (canonical) return canonical;
    const normalized = slug.toLowerCase().trim();
    return DEFAULT_CANONICAL_SLUG_ALIASES[normalized] || normalized;
}

/**
 * Checks if the current slug is effectively canonical.
 */
export function isCanonicalSlug(slug: string): boolean {
    if (!slug) return true;
    const normalized = slug.toLowerCase().trim();
    return getCanonicalCategorySlug(normalized) === normalized;
}

