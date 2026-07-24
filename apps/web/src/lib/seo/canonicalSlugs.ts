import { CatalogFacade } from '@esparex/shared';

export const CANONICAL_SLUG_MAPPING = CatalogFacade.category.normalize.CANONICAL_CATEGORY_SLUG_ALIASES;

/**
 * Returns the canonical slug for a given category input.
 * Delegates to CatalogFacade in @esparex/shared to eliminate duplicate mapping drift.
 */
export function getCanonicalCategorySlug(slug: string): string {
    return CatalogFacade.category.normalize.canonicalizeCategorySlug(slug);
}

/**
 * Checks if the current slug is effectively canonical.
 */
export function isCanonicalSlug(slug: string): boolean {
    if (!slug) return true;
    const normalized = slug.toLowerCase().trim();
    return getCanonicalCategorySlug(normalized) === normalized;
}

