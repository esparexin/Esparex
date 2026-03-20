"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { CategoryData, Brand } from "@/components/user/post-ad/types";
import type { SparePart, ScreenSize } from "@/api/user/masterData";
import { getCategorySchema } from "@/api/user/categories";
import type { CategoryFilter } from "@shared/schemas/catalog.schema";
import { IconRegistry } from "@/icons/IconRegistry";
import type { LucideIcon } from "lucide-react";
import logger from "@/lib/logger";
import { TOAST_MESSAGES } from "@/constants/toastMessages";
import { normalizeOptionalObjectId } from "@/utils/normalizeOptionalObjectId";
import { useCategoriesQuery } from "@/queries/useCategoriesQuery";

interface CategorySchemaType {
    categoryId: string;
    categoryName: string;
    filters: CategoryFilter[];
}

export function usePostAdCategories(onError?: (msg: string) => void) {
    const [brandMap, setBrandMap] = useState<Record<string, Brand>>({});
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [availableSpareParts, setAvailableSpareParts] = useState<SparePart[]>([]);
    const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(false);
    const [categorySchema, setCategorySchema] = useState<CategorySchemaType | null>(null);
    // Track the last category loaded so refreshBrandsForCurrentCategory can re-fetch without args
    const [activeCategoryId, setActiveCategoryId] = useState<string>("");
    const { data: categories = [], error: categoriesError } = useCategoriesQuery();

    const getCategoryIcon = useCallback((iconName?: string) => {
        const registry = IconRegistry as unknown as Record<string, LucideIcon>;
        if (iconName && registry[iconName]) {
            return registry[iconName];
        }
        return registry.Smartphone;
    }, []);

    const dynamicCategories = useMemo<CategoryData[]>(
        () =>
            categories
                .filter(cat => cat.listingType?.includes('postad'))
                .map((category) => ({
                    id: String(category.id || ""),
                    name: category.name,
                    slug: category.slug || "",
                    icon: getCategoryIcon(category.icon),
                    // Metadata fields
                    hasScreenSizes: Boolean(category.hasScreenSizes),
                    supportsSpareParts: Boolean(category.listingType?.includes('postsparepart')),
                    listingType: category.listingType || [],
                })),
        [categories, getCategoryIcon]
    );

    const categoryMap = useMemo(
        () => Object.fromEntries(dynamicCategories.map((category) => [category.id, category])),
        [dynamicCategories]
    );

    useEffect(() => {
        if (!categoriesError) return;
        logger.error("Failed to load categories", categoriesError);
        onError?.(TOAST_MESSAGES.LOAD_FAILED);
    }, [categoriesError, onError]);

    const loadBrandsForCategory = useCallback(async (categoryId: string) => {
        if (!categoryId) return;
        setActiveCategoryId(categoryId);
        try {
            const { getBrands, getScreenSizes } = await import('@/api/user/masterData');
            const brandsData = await getBrands(categoryId);

            const map: Record<string, Brand> = {};
            brandsData.forEach((b: Brand) => (map[b.name] = b));
            setBrandMap(map);
            setAvailableBrands(brandsData.map((b: Brand) => b.name));

            const catObj = categoryMap[categoryId];
            const shouldLoadScreenSizes = Boolean(catObj?.hasScreenSizes);

            if (shouldLoadScreenSizes) {
                const sizes: ScreenSize[] = await getScreenSizes(categoryId);
                setAvailableSizes(sizes.map((s) => s.size || s.name || ""));
            } else {
                setAvailableSizes([]);
            }
        } catch (err) {
            logger.error("Failed to load brands:", err);
            setAvailableBrands([]);
            setAvailableSizes([]);
            onError?.("Failed to load brands");
        }
    }, [categoryMap, onError]);

    const loadSparePartsForCategory = useCallback(async (categoryId: string) => {
        if (!categoryId) return;
        setIsLoadingSpareParts(true);
        try {
            const { getSpareParts } = await import('@/api/user/masterData');
            const parts = await getSpareParts(categoryId, 'postad');
            setAvailableSpareParts(
                parts
                    .map((part) => ({
                        ...part,
                        id: normalizeOptionalObjectId(part.id ?? part._id),
                    }))
                    .filter((part) => typeof part.id === "string" && part.id.length > 0)
            );
        } catch (err) {
            logger.error("Failed to load spare parts", err);
            setAvailableSpareParts([]);
            onError?.("Failed to load spare parts");
        } finally {
            setIsLoadingSpareParts(false);
        }
    }, [onError]);

    const loadCategorySchema = useCallback(async (categoryId: string) => {
        if (!categoryId || !/^[0-9a-f]{24}$/i.test(categoryId)) {
            setCategorySchema(null);
            return;
        }
        try {
            const schema = await getCategorySchema(categoryId);
            if (schema) {
                const categoryIdValue = typeof schema.categoryId === "string" ? schema.categoryId : null;
                const categoryNameValue = typeof schema.categoryName === "string" ? schema.categoryName : null;
                const filtersValue = Array.isArray(schema.filters) ? schema.filters : null;

                if (categoryIdValue && categoryNameValue && filtersValue) {
                    setCategorySchema({
                        categoryId: categoryIdValue,
                        categoryName: categoryNameValue,
                        filters: filtersValue as CategoryFilter[],
                    });
                } else {
                    setCategorySchema(null);
                }
            } else {
                setCategorySchema(null);
            }
        } catch (err) {
            logger.error("Failed to load category schema", err);
            setCategorySchema(null);
        }
    }, []);

    // Allow callers (e.g. PostAdContext after a brand is suggested and later approved) to
    // re-fetch the brand list for the currently active category without tracking the ID externally.
    const refreshBrandsForCurrentCategory = useCallback(async () => {
        if (activeCategoryId) {
            await loadBrandsForCategory(activeCategoryId);
        }
    }, [activeCategoryId, loadBrandsForCategory]);

    return {
        dynamicCategories,
        categoryMap,
        brandMap,
        availableBrands,
        availableSizes,
        availableSpareParts,
        isLoadingSpareParts,
        categorySchema,
        loadBrandsForCategory,
        refreshBrandsForCurrentCategory,
        loadSparePartsForCategory,
        loadCategorySchema,
    };
}
