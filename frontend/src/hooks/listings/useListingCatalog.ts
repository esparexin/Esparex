"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { ListingCategory } from "@/types/listing";
import type { Brand, SparePart, ScreenSize, DeviceModel } from "@/api/user/masterData";
import { getCategorySchema } from "@/api/user/categories";
import type { CategoryFilter } from "@shared/schemas/catalog.schema";
import { IconRegistry } from "@/icons/IconRegistry";
import type { LucideIcon } from "lucide-react";
import logger from "@/lib/logger";
import { TOAST_MESSAGES } from "@/constants/toastMessages";
import { normalizeOptionalObjectId } from "@/utils/listings/locationUtils";
import { useCategoriesQuery } from "@/queries/useCategoriesQuery";
import type { FormPlacement } from "@shared/enums/listingType";

interface CategorySchemaType {
    categoryId: string;
    categoryName: string;
    filters: CategoryFilter[];
}

interface UseListingCatalogProps {
    listingType: FormPlacement;
    onError?: (msg: string) => void;
}

/**
 * 📚 Unified Catalog Hook for Listings
 * Manages category, brand, model, and spare part data.
 */
export function useListingCatalog({ listingType, onError }: UseListingCatalogProps) {
    const [brandMap, setBrandMap] = useState<Record<string, Brand>>({});
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [availableSpareParts, setAvailableSpareParts] = useState<SparePart[]>([]);
    const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([]);
    const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(false);
    const [categorySchema, setCategorySchema] = useState<CategorySchemaType | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<string>("");

    const { data: categories = [], error: categoriesError } = useCategoriesQuery();

    const getCategoryIcon = useCallback((iconName?: string) => {
        const registry = IconRegistry as unknown as Record<string, LucideIcon>;
        if (iconName && registry[iconName]) {
            return registry[iconName];
        }
        return registry.Smartphone;
    }, []);

    const dynamicCategories = useMemo<ListingCategory[]>(
        () =>
            categories
                .filter(cat => cat.listingType?.includes(listingType))
                .map((category) => ({
                    id: String(category.id || ""),
                    name: category.name,
                    slug: category.slug || "",
                    icon: getCategoryIcon(category.icon),
                    hasScreenSizes: Boolean(category.hasScreenSizes),
                    supportsSpareParts: Boolean(category.listingType?.includes('postsparepart')),
                    listingType: category.listingType || [],
                    serviceSelectionMode: category.serviceSelectionMode as 'single' | 'multi',
                })),
        [categories, getCategoryIcon, listingType]
    );

    const categoryMap = useMemo(
        () => Object.fromEntries(dynamicCategories.map((category) => [category.id, category])),
        [dynamicCategories]
    );

    useEffect(() => {
        if (!categoriesError) return;
        logger.error(`[Catalog] Failed to load categories for ${listingType}`, categoriesError);
        onError?.(TOAST_MESSAGES.LOAD_FAILED);
    }, [categoriesError, onError, listingType]);

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
            if (catObj?.hasScreenSizes) {
                const sizes: ScreenSize[] = await getScreenSizes(categoryId);
                setAvailableSizes(sizes.map((s) => s.size || s.name || ""));
            } else {
                setAvailableSizes([]);
            }
        } catch (err) {
            logger.error(`[Catalog] Failed to load brands for ${categoryId}:`, err);
            setAvailableBrands([]);
            setAvailableSizes([]);
            onError?.("Failed to load brands");
        }
    }, [categoryMap, onError]);

    const loadModelsForBrand = useCallback(async (brandId?: string, categoryId?: string) => {
        if (!brandId) {
            setAvailableModels([]);
            return;
        }
        try {
            const { getModels } = await import('@/api/user/masterData');
            const models = await getModels(brandId, categoryId);
            setAvailableModels(models);
        } catch (err) {
            logger.error(`[Catalog] Failed to load models for brand ${brandId}:`, err);
            setAvailableModels([]);
            onError?.("Failed to load models");
        }
    }, [onError]);

    const loadServiceTypes = useCallback(async (categoryId?: string) => {
        try {
            const { getServiceTypes } = await import('@/api/user/masterData');
            const serviceTypes = await getServiceTypes(categoryId);
            const names = Array.from(
                new Set(
                    serviceTypes
                        .map((item) => item.name?.trim())
                        .filter((name): name is string => typeof name === "string" && name.length > 0)
                )
            );
            setAvailableServiceTypes(names);
        } catch (err) {
            logger.error(`[Catalog] Failed to load service types for ${categoryId}:`, err);
            setAvailableServiceTypes([]);
        }
    }, []);

    const loadSparePartsForCategory = useCallback(async (categoryId: string) => {
        if (!categoryId) return;
        setIsLoadingSpareParts(true);
        try {
            const { getSpareParts } = await import('@/api/user/masterData');
            // Spare parts for 'postservice' use the same catalog slot as 'postad' (handled by listingTypeMap)
            const resolvedPlacement = listingType === 'postservice' ? 'postad' : listingType;
            const parts = await getSpareParts(categoryId, resolvedPlacement as 'postad' | 'postsparepart');
            setAvailableSpareParts(
                parts
                    .map((part) => ({
                        ...part,
                        id: normalizeOptionalObjectId(part.id ?? part._id),
                    }))
                    .filter((part) => typeof part.id === "string" && part.id.length > 0)
            );
        } catch (err) {
            logger.error(`[Catalog] Failed to load spare parts for ${categoryId}:`, err);
            setAvailableSpareParts([]);
            onError?.("Failed to load spare parts");
        } finally {
            setIsLoadingSpareParts(false);
        }
    }, [listingType, onError]);

    const loadCategorySchema = useCallback(async (categoryId: string) => {
        if (!categoryId || !/^[0-9a-f]{24}$/i.test(categoryId)) {
            setCategorySchema(null);
            return;
        }
        try {
            const schema = await getCategorySchema(categoryId);
            if (schema && schema.categoryId && schema.categoryName && Array.isArray(schema.filters)) {
                setCategorySchema({
                    categoryId: String(schema.categoryId),
                    categoryName: String(schema.categoryName),
                    filters: schema.filters as CategoryFilter[],
                });
            } else {
                setCategorySchema(null);
            }
        } catch (err) {
            logger.error(`[Catalog] Failed to load schema for ${categoryId}:`, err);
            setCategorySchema(null);
        }
    }, []);

    const refreshBrands = useCallback(async () => {
        if (activeCategoryId) {
            await loadBrandsForCategory(activeCategoryId);
        }
    }, [activeCategoryId, loadBrandsForCategory]);

    return {
        dynamicCategories,
        categoryMap,
        brandMap,
        availableBrands,
        availableModels,
        availableSizes,
        availableSpareParts,
        availableServiceTypes,
        isLoadingSpareParts,
        categorySchema,
        loadBrandsForCategory,
        loadModelsForBrand,
        loadServiceTypes,
        loadSparePartsForCategory,
        loadCategorySchema,
        refreshBrands,
        activeCategoryId
    };
}
