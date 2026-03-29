import { useMemo } from "react";
import type { CategoryData } from "@/lib/api/categories";
import { LISTING_TYPE, type ListingTypeValue } from "@shared/enums/listingType";

/**
 * A shared hook to consistently resolve which categories can be assigned to models/brands/spare-parts.
 * Strips out inactive, deleted, or rejected categories.
 * 
 * @param categories The raw category list from context or API
 * @param condition An optional custom filter (e.g. checking listingType for spare parts)
 */
export function useAssignableCategories(categories: CategoryData[], condition?: (cat: CategoryData) => boolean) {
    return useMemo(() => {
        // Shared global filters
        const assignableCategories = categories.filter(
            (cat) => cat.isActive !== false && !cat.isDeleted && cat.status !== 'inactive' && cat.status !== 'rejected'
        ).filter(condition || (() => true));

        // Create a quick lookup set
        const assignableCategoryIdSet = new Set(assignableCategories.map(c => c.id));

        return {
            assignableCategories,
            assignableCategoryIdSet
        };
    }, [categories, condition]);
}

export const categorySupportsListingType = (category: Pick<CategoryData, "listingType">, listingType: ListingTypeValue) =>
    Array.isArray(category.listingType) && category.listingType.includes(listingType);

export const categorySupportsAds = (category: Pick<CategoryData, "listingType">) =>
    categorySupportsListingType(category, LISTING_TYPE.AD);

export const categorySupportsServices = (category: Pick<CategoryData, "listingType">) =>
    categorySupportsListingType(category, LISTING_TYPE.SERVICE);

export const categorySupportsSpareParts = (category: Pick<CategoryData, "listingType">) =>
    categorySupportsListingType(category, LISTING_TYPE.SPARE_PART);
