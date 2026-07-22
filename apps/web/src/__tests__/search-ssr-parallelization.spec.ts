import { describe, expect, it } from 'vitest';
import { parsePublicBrowseParams } from '@/lib/publicBrowseRoutes';
import { resolveBrowseCategorySelection } from '@/lib/browse/browseFilterNormalization';
import type { Category } from '@/lib/api/user/categories';

const mockCategories: Category[] = [
    {
        id: 'cat-101',
        name: 'Mobile Phones',
        slug: 'mobile-phones',
        isActive: true,
        serviceSelectionMode: 'single',
        hasScreenSizes: false,
        isDeleted: false,
    },
    {
        id: 'cat-102',
        name: 'Spare Parts',
        slug: 'spare-parts',
        isActive: true,
        serviceSelectionMode: 'single',
        hasScreenSizes: false,
        isDeleted: false,
    },
];

/**
 * Determines whether the Search SSR handler must perform sequential category
 * slug resolution before triggering the listings page fetch.
 */
function requiresSequentialSlugResolution(parsed: ReturnType<typeof parsePublicBrowseParams>): boolean {
    return Boolean(parsed.category && !parsed.categoryId);
}

describe('Search SSR Parallelization Rule Audit', () => {
    it('enables parallel fetch when no category filter is provided', () => {
        const parsed = parsePublicBrowseParams({ q: 'display screen' });
        expect(requiresSequentialSlugResolution(parsed)).toBe(false);
    });

    it('enables parallel fetch when categoryId is directly provided as an ID', () => {
        const parsed = parsePublicBrowseParams({ categoryId: 'cat-101', page: '2' });
        expect(requiresSequentialSlugResolution(parsed)).toBe(false);
    });

    it('requires sequential slug resolution ONLY when category is a slug string without categoryId', () => {
        const parsed = parsePublicBrowseParams({ category: 'mobile-phones' });
        expect(requiresSequentialSlugResolution(parsed)).toBe(true);

        const resolved = resolveBrowseCategorySelection(parsed.category, mockCategories);
        expect(resolved.categoryId).toBe('cat-101');
    });

    it('resolves categoryId directly when categoryId takes precedence over category slug', () => {
        const parsed = parsePublicBrowseParams({ category: 'spare-parts', categoryId: 'cat-101' });
        expect(requiresSequentialSlugResolution(parsed)).toBe(false);

        const selectionParam = parsed.categoryId ?? parsed.category;
        expect(selectionParam).toBe('cat-101');
    });
});
