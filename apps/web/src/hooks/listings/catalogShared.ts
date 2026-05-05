"use client";

import type { LucideIcon } from "lucide-react";
import { IconRegistry } from "@/icons/IconRegistry";
import type { ScreenSize } from "@/lib/api/user/masterData";
import type { Category } from "@/lib/api/user/categories";
import type { ListingCategory } from "@/types/listing";
import { LISTING_TYPE, type ListingTypeValue } from "@shared/enums/listingType";
import type { CategoryFilter } from "@shared";

export interface CategorySchemaType {
    categoryId: string;
    categoryName: string;
    filters: CategoryFilter[];
}

const screenSizeSortValue = (raw: string): number => {
    const numeric = Number(raw.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
};

const getCategoryIcon = (iconName?: string) => {
    const registry = IconRegistry as unknown as Record<string, LucideIcon>;
    if (iconName && registry[iconName]) {
        return registry[iconName];
    }
    return registry.Smartphone;
};

export const normalizeScreenSizeOptions = (sizes: ScreenSize[]): string[] => {
    const seen = new Set<string>();
    return sizes
        .map((item) => (item.size || item.name || "").trim())
        .filter((value) => value.length > 0)
        .filter((value) => {
            const key = value.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => screenSizeSortValue(a) - screenSizeSortValue(b));
};

export const buildDynamicCategories = (
    categories: Category[],
    listingType: ListingTypeValue
): ListingCategory[] => {
    return categories
        .filter((category) => {
            const types = category.listingType || [];
            return types.includes(listingType);
        })
        .map((category) => ({
            id: String(category.id || ""),
            name: category.name,
            slug: category.slug || "",
            icon: getCategoryIcon(category.icon),
            hasScreenSizes: Boolean(category.hasScreenSizes),
            supportsSpareParts: Boolean(category.listingType?.includes(LISTING_TYPE.SPARE_PART)),
            listingType: category.listingType || [],
            serviceSelectionMode: category.serviceSelectionMode as "single" | "multi",
        }));
};
