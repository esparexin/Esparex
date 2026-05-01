export const CANONICAL_SLUG_MAPPING: Record<string, string> = {
    // Mobile Phones
    'mobiles': 'mobile-phones',
    'smartphones': 'mobile-phones',
    'mobile-devices': 'mobile-phones',

    // Laptops
    'laptop': 'laptops',

    // Tablets
    'tablet': 'tablets',
    'ipad': 'tablets',

    // TVs
    'tv': 'led-tv',
    'smart-tv': 'led-tv',
    'led-tv': 'led-tv', // Self-ref for completeness

    // Monitors
    'monitors': 'monitor',
    'desktop-monitor': 'monitor',
};

/**
 * Returns the canonical slug for a given category input.
 * If no alias is found, returns the original slug (lowercased).
 */
export function getCanonicalCategorySlug(slug: string): string {
    if (!slug) return '';
    const normalized = slug.toLowerCase().trim();
    return CANONICAL_SLUG_MAPPING[normalized] || normalized;
}

/**
 * Checks if the current slug is effectively canonical.
 */
export function isCanonicalSlug(slug: string): boolean {
    return getCanonicalCategorySlug(slug) === slug.toLowerCase().trim();
}
