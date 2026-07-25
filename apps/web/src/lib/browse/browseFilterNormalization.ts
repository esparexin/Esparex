import type { Category } from "@/lib/api/user/categories";
import { CatalogFacade } from "@esparex/shared";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export type BrowseBrandOption = {
    value: string;
    label: string;
};

const readToken = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

export const isObjectIdToken = (value: unknown): value is string => {
    const normalized = readToken(value);
    return Boolean(normalized && OBJECT_ID_PATTERN.test(normalized));
};

export const parseBrowseTokenList = (value: unknown): string[] => {
    const raw = Array.isArray(value) ? value.join(",") : readToken(value);
    if (!raw) return [];

    return Array.from(
        new Set(
            raw
                .split(",")
                .map((token) => token.trim())
                .filter((token) => token.length > 0)
        )
    );
};

export const serializeBrowseTokenList = (value: unknown): string | undefined => {
    const tokens = parseBrowseTokenList(value);
    return tokens.length > 0 ? tokens.join(",") : undefined;
};

export const buildBrowseBrandOptions = (
    listings: Array<{ brand?: unknown; brandName?: unknown; brandId?: unknown }>
): BrowseBrandOption[] => {
    const byValue = new Map<string, BrowseBrandOption>();

    listings.forEach((listing) => {
        const label = readToken(listing.brandName) || readToken(listing.brand);
        const brandId = readToken(listing.brandId);
        const value = brandId || label;

        if (!value) return;

        const nextOption: BrowseBrandOption = {
            value,
            label: label || value,
        };

        const existing = byValue.get(value);
        if (!existing) {
            byValue.set(value, nextOption);
            return;
        }

        if (existing.label === existing.value && nextOption.label !== nextOption.value) {
            byValue.set(value, nextOption);
        }
    });

    return Array.from(byValue.values()).sort((left, right) => left.label.localeCompare(right.label));
};

const findMatchingBrandOption = (
    token: string,
    options: BrowseBrandOption[]
): BrowseBrandOption | undefined => {
    const normalizedToken = token.trim().toLowerCase();
    return options.find((option) =>
        option.value.toLowerCase() === normalizedToken || option.label.toLowerCase() === normalizedToken
    );
};

export const resolveBrowseBrandSelection = (
    selectedBrands: string[],
    options: BrowseBrandOption[]
): string[] => Array.from(
    new Set(
        selectedBrands
            .map((token) => {
                const normalizedToken = readToken(token);
                if (!normalizedToken) return undefined;
                return findMatchingBrandOption(normalizedToken, options)?.value || normalizedToken;
            })
            .filter((token): token is string => Boolean(token))
    )
);

export const resolveBrowseBrandLabels = (
    selectedBrands: string[],
    options: BrowseBrandOption[]
): string[] => Array.from(
    new Set(
        selectedBrands
            .map((token) => {
                const normalizedToken = readToken(token);
                if (!normalizedToken) return undefined;
                return findMatchingBrandOption(normalizedToken, options)?.label || normalizedToken;
            })
            .filter((token): token is string => Boolean(token))
    )
);

export type ResolvedBrowseCategory = {
    category?: string;
    categoryId?: string;
    label?: string | null;
};

export const resolveBrowseCategorySelection = (
    selectedCategory: string | null | undefined,
    categories: Category[] = []
): ResolvedBrowseCategory => {
    const rawCategoryToken = readToken(selectedCategory);
    if (!rawCategoryToken) {
        return {};
    }

    const canonicalSlug = CatalogFacade.category.normalize.canonicalizeCategorySlug(rawCategoryToken);
    const targetSlugLower = (canonicalSlug || rawCategoryToken).toLowerCase();

    const matchedCategory = categories.find((category) => {
        if (!category) return false;
        if (category.id === rawCategoryToken) return true;
        const categorySlugLower = (category.slug || "").toLowerCase();
        const canonicalCategorySlug = CatalogFacade.category.normalize.canonicalizeCategorySlug(categorySlugLower);
        return (
            categorySlugLower === targetSlugLower ||
            canonicalCategorySlug === targetSlugLower ||
            (category.name && category.name.toLowerCase() === targetSlugLower)
        );
    });

    const matchedCategoryId = readToken(matchedCategory?.id);
    const resolvedCategoryId =
        matchedCategoryId ||
        (isObjectIdToken(rawCategoryToken) ? rawCategoryToken : undefined);

    const resolvedCategory = resolvedCategoryId ? undefined : (canonicalSlug || rawCategoryToken);
    const label = matchedCategory?.displayName || matchedCategory?.name || matchedCategory?.slug || resolvedCategory || null;

    return {
        category: resolvedCategory,
        categoryId: resolvedCategoryId,
        label,
    };
};

