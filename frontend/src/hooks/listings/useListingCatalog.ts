"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { ListingCategory } from "@/types/listing";
import type { Brand, SparePart, ScreenSize, DeviceModel, ServiceType } from "@/lib/api/user/masterData";
import { getCategorySchema } from "@/lib/api/user/categories";
import type { CategoryFilter } from "@shared/schemas/catalog.schema";
import { LISTING_TYPE, type ListingTypeValue, type FormPlacement } from "@shared/enums/listingType";
import { categoryEnumToRecord } from "@shared/utils/listingTypeMap";
import { IconRegistry } from "@/icons/IconRegistry";
import type { LucideIcon } from "lucide-react";
import logger from "@/lib/logger";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import { normalizeOptionalObjectId } from "@/lib/listings/locationUtils";
import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQuery";

interface CategorySchemaType {
    categoryId: string;
    categoryName: string;
    filters: CategoryFilter[];
}

interface UseListingCatalogProps {
    listingType: FormPlacement;
    onError?: (msg: string) => void;
}

const screenSizeSortValue = (raw: string): number => {
    const numeric = Number(raw.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
};

const normalizeScreenSizeOptions = (sizes: ScreenSize[]): string[] => {
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
    const [availableServiceTypes, setAvailableServiceTypes] = useState<ServiceType[]>([]);
    const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(false);
    const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
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
        () => {
            const canonicalListingType = categoryEnumToRecord(listingType);

            return categories
                .filter(cat => {
                    const types = cat.listingType || [];
                    return types.includes(canonicalListingType);
                })
                .map((category) => ({
                    id: String(category.id || ""),
                    name: category.name,
                    slug: category.slug || "",
                    icon: getCategoryIcon(category.icon),
                    hasScreenSizes: Boolean(category.hasScreenSizes),
                    supportsSpareParts: Boolean(category.listingType?.includes(LISTING_TYPE.SPARE_PART)),
                    listingType: category.listingType || [],
                    serviceSelectionMode: category.serviceSelectionMode as 'single' | 'multi',
                }));
        },
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
            const { getBrands, getScreenSizes } = await import("@/lib/api/user/masterData");
            const brandsData = await getBrands(categoryId);

            const map: Record<string, Brand> = {};
            brandsData.forEach((b: Brand) => (map[b.name] = b));
            setBrandMap(map);
            setAvailableBrands(brandsData.map((b: Brand) => b.name));

            const catObj = categoryMap[categoryId];
            const normalizedCategoryText = `${catObj?.slug ?? ""} ${catObj?.name ?? ""}`.toLowerCase();
            const shouldLoadScreenSizes =
                Boolean(catObj?.hasScreenSizes) ||
                normalizedCategoryText.includes("tv") ||
                normalizedCategoryText.includes("monitor");

            if (shouldLoadScreenSizes) {
                const sizes: ScreenSize[] = await getScreenSizes(categoryId);
                setAvailableSizes(normalizeScreenSizeOptions(sizes));
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
            const { getModels } = await import("@/lib/api/user/masterData");
            const models = await getModels(brandId, categoryId);
            setAvailableModels(models);
        } catch (err) {
            logger.error(`[Catalog] Failed to load models for brand ${brandId}:`, err);
            setAvailableModels([]);
            onError?.("Failed to load models");
        }
    }, [onError]);

    const loadServiceTypes = useCallback(async (categoryId?: string): Promise<ServiceType[]> => {
        if (!categoryId) {
            setAvailableServiceTypes([]);
            return [];
        }
        setIsLoadingServiceTypes(true);
        try {
            const { getServiceTypes } = await import("@/lib/api/user/masterData");
            const serviceTypes = await getServiceTypes(categoryId);
            const seen = new Set<string>();
            const normalized = serviceTypes
                .map((item) => {
                    const id = normalizeOptionalObjectId(item.id ?? item._id);
                    const name = item.name?.trim();
                    if (!id || !name) return null;
                    if (seen.has(id)) return null;
                    seen.add(id);
                    return {
                        ...item,
                        id,
                        name
                    } as ServiceType;
                })
                .filter((item): item is ServiceType => Boolean(item));
            setAvailableServiceTypes(normalized);
            return normalized;
        } catch (err) {
            logger.error(`[Catalog] Failed to load service types for ${categoryId}:`, err);
            setAvailableServiceTypes([]);
            onError?.("Failed to load service types");
            return [];
        } finally {
            setIsLoadingServiceTypes(false);
        }
    }, [onError]);

    const loadSparePartsForCategory = useCallback(async (categoryId: string) => {
        if (!categoryId) return;
        setIsLoadingSpareParts(true);
        try {
            const { getSpareParts } = await import("@/lib/api/user/masterData");
            const resolvedListingType: ListingTypeValue =
                listingType === "postservice" ? LISTING_TYPE.AD : categoryEnumToRecord(listingType);
            const parts = await getSpareParts(categoryId, resolvedListingType);
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
        isLoadingServiceTypes,
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
