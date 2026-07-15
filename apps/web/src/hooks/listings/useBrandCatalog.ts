"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListingCategory } from "@/types/listing";
import {
    getBrands,
    getModels,
    getScreenSizes,
    type Brand,
    type DeviceModel,
} from "@/lib/api/user/masterData";
import logger from "@/lib/logger";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";
import { normalizeScreenSizeOptions } from "./catalogShared";

interface UseBrandCatalogProps {
    categoryMap: Record<string, ListingCategory>;
    onError?: (msg: string) => void;
    includeScreenSizes?: boolean;
}

const BRANDS_STALE_TIME = 10 * 60 * 1000; // 10 minutes
const MODELS_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const SCREEN_SIZES_STALE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Normalizes and merges a brand into existing brands array preserving alphabetical sorting by name.
 */
function mergeBrandIntoList(list: Brand[], entity: { id: string; name: string }): Brand[] {
    const existingIndex = list.findIndex(
        (b) => b.id === entity.id || b._id === entity.id || b.name.toLowerCase() === entity.name.toLowerCase()
    );
    let updated: Brand[];
    if (existingIndex >= 0) {
        updated = [...list];
        updated[existingIndex] = { ...updated[existingIndex], id: entity.id, _id: entity.id, name: entity.name };
    } else {
        updated = [...list, { id: entity.id, _id: entity.id, name: entity.name }];
    }
    return updated.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/**
 * Normalizes and merges a device model into existing models array preserving alphabetical sorting by name.
 */
function mergeModelIntoList(list: DeviceModel[], entity: { id: string; name: string; brandId?: string; categoryId?: string }): DeviceModel[] {
    const existingIndex = list.findIndex(
        (m) => m.id === entity.id || m._id === entity.id || m.name.toLowerCase() === entity.name.toLowerCase()
    );
    let updated: DeviceModel[];
    if (existingIndex >= 0) {
        updated = [...list];
        updated[existingIndex] = { ...updated[existingIndex], id: entity.id, _id: entity.id, name: entity.name, brandId: entity.brandId, categoryId: entity.categoryId };
    } else {
        updated = [...list, { id: entity.id, _id: entity.id, name: entity.name, brandId: entity.brandId, categoryId: entity.categoryId }];
    }
    return updated.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function useBrandCatalog({
    categoryMap,
    onError,
    includeScreenSizes = true,
}: UseBrandCatalogProps) {
    const queryClient = useQueryClient();

    const [activeCategoryId, setActiveCategoryId] = useState<string>("");
    const [brandsError, setBrandsError] = useState<string | null>(null);

    const [selectedBrandId, setSelectedBrandId] = useState<string>("");
    const [modelSearch, setModelSearch] = useState<string>("");

    /**
     * Preserve existing imperative API contract.
     * Consumers still call loadBrandsForCategory().
     * React Query handles the actual fetching and caching.
     */
    const loadBrandsForCategory = useCallback(
        async (categoryId: string) => {
            const normalizedCategoryId =
                sanitizeMongoObjectId(categoryId);

            if (!normalizedCategoryId) {
                setActiveCategoryId("");
                setSelectedBrandId("");
                setModelSearch("");
                setBrandsError(null);
                return;
            }

            setActiveCategoryId(normalizedCategoryId);
            setSelectedBrandId("");
            setModelSearch("");
            setBrandsError(null);
        },
        []
    );

    /**
     * Preserve existing imperative API contract.
     * Consumers still call loadModelsForBrand().
     * React Query handles the actual fetching and caching.
     */
    const loadModelsForBrand = useCallback(
        async (
            brandId?: string,
            categoryId?: string,
            search?: string
        ) => {
            const normalizedBrandId =
                sanitizeMongoObjectId(brandId);

            if (!normalizedBrandId) {
                setSelectedBrandId("");
                setModelSearch("");
                return;
            }

            // Keep category synchronized if provided.
            if (categoryId) {
                const normalizedCategoryId =
                    sanitizeMongoObjectId(categoryId);

                if (normalizedCategoryId) {
                    setActiveCategoryId(normalizedCategoryId);
                }
            }

            setSelectedBrandId(normalizedBrandId);
            setModelSearch(search ?? "");
        },
        []
    );

    /**
     * Determine if this category supports screen sizes.
     */
    const category = activeCategoryId
        ? categoryMap[activeCategoryId]
        : undefined;

    const shouldLoadScreenSizes =
        includeScreenSizes &&
        Boolean(activeCategoryId) &&
        Boolean(category?.hasScreenSizes);

    /**
     * Brands Query
     * Shared cache + automatic request deduplication.
     */
    const brandsQuery = useQuery({
        queryKey: ["catalog", "brands", activeCategoryId],
        enabled: Boolean(activeCategoryId),
        staleTime: BRANDS_STALE_TIME,
        gcTime: BRANDS_STALE_TIME,
        queryFn: async () => {
            try {
                return await getBrands(activeCategoryId);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Failed to load brands";

                logger.error(
                    `[Catalog] Failed to load brands for ${activeCategoryId}:`,
                    error
                );

                setBrandsError(message);
                onError?.(message);
                throw error;
            }
        },
    });

    /**
     * Screen Sizes Query
     */
    const screenSizesQuery = useQuery({
        queryKey: ["catalog", "screen-sizes", activeCategoryId],
        enabled: shouldLoadScreenSizes,
        staleTime: SCREEN_SIZES_STALE_TIME,
        gcTime: SCREEN_SIZES_STALE_TIME,
        queryFn: async () => {
            const sizes = await getScreenSizes(activeCategoryId);
            return normalizeScreenSizeOptions(sizes);
        },
    });

    /**
     * Models Query
     * Includes search term in query key.
     */
    const modelsQuery = useQuery({
        queryKey: [
            "catalog",
            "models",
            activeCategoryId,
            selectedBrandId,
            modelSearch,
        ],
        enabled: Boolean(selectedBrandId),
        staleTime: MODELS_STALE_TIME,
        gcTime: MODELS_STALE_TIME,
        queryFn: async () => {
            try {
                return await getModels(
                    selectedBrandId,
                    activeCategoryId || undefined,
                    modelSearch || undefined
                );
            } catch (error) {
                logger.error(
                    `[Catalog] Failed to load models for brand ${selectedBrandId}:`,
                    error
                );

                onError?.("Failed to load models");
                throw error;
            }
        },
    });

    /**
     * Derived outputs preserving original API contract.
     */
    const brandsData = brandsQuery.data ?? [];

    const brandMap: Record<string, Brand> = {};
    for (const brand of brandsData) {
        brandMap[brand.name] = brand;
    }

    const availableBrands = brandsData.map(
        (brand) => brand.name
    );

    const availableModels = modelsQuery.data ?? [];

    const availableSizes = shouldLoadScreenSizes
        ? screenSizesQuery.data ?? []
        : [];

    /**
     * Manual refresh preserving original API contract.
     */
    const refreshBrands = useCallback(async () => {
        if (!activeCategoryId) {
            return;
        }

        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: [
                    "catalog",
                    "brands",
                    activeCategoryId,
                ],
            }),
            queryClient.invalidateQueries({
                queryKey: [
                    "catalog",
                    "screen-sizes",
                    activeCategoryId,
                ],
            }),
        ]);
    }, [activeCategoryId, queryClient]);

    /**
     * Reconciles brand visibility in the React Query cache.
     * Attempts to invalidate and await refetching; if synchronization encounters network/transport errors
     * (timeout, cancellation, offline, transient 5xx), falls back to safely merging into the cache preserving alphabetical ordering.
     */
    const ensureBrandVisible = useCallback(
        async (entity: { id: string; name: string }) => {
            if (!activeCategoryId) return;
            const queryKey = ["catalog", "brands", activeCategoryId];
            try {
                // First merge optimistically so visibility is immediate and normalized
                queryClient.setQueryData<Brand[]>(queryKey, (oldData = []) => mergeBrandIntoList(oldData, entity));
                // Then invalidate to ensure server consistency
                await queryClient.invalidateQueries({ queryKey });
            } catch (error) {
                logger.warn(`[Catalog] ensureBrandVisible refetch failed or timed out, retaining merged cache:`, error);
                queryClient.setQueryData<Brand[]>(queryKey, (oldData = []) => mergeBrandIntoList(oldData, entity));
            }
        },
        [activeCategoryId, queryClient]
    );

    /**
     * Reconciles device model visibility in the React Query cache for the active brand.
     * Attempts to invalidate and await refetching; if synchronization encounters network/transport errors,
     * falls back to safely merging into the cache preserving alphabetical ordering.
     */
    const ensureModelVisible = useCallback(
        async (entity: { id: string; name: string; brandId: string }) => {
            if (!activeCategoryId || !entity.brandId) return;
            const queryKey = [
                "catalog",
                "models",
                activeCategoryId,
                entity.brandId,
                modelSearch,
            ];
            try {
                // First merge optimistically so visibility is immediate and normalized
                queryClient.setQueryData<DeviceModel[]>(queryKey, (oldData = []) => mergeModelIntoList(oldData, { ...entity, categoryId: activeCategoryId }));
                // Then invalidate to ensure server consistency
                await queryClient.invalidateQueries({ queryKey });
            } catch (error) {
                logger.warn(`[Catalog] ensureModelVisible refetch failed or timed out, retaining merged cache:`, error);
                queryClient.setQueryData<DeviceModel[]>(queryKey, (oldData = []) => mergeModelIntoList(oldData, { ...entity, categoryId: activeCategoryId }));
            }
        },
        [activeCategoryId, modelSearch, queryClient]
    );

    return {
        brandMap,
        availableBrands,
        availableModels,
        availableSizes,
        activeCategoryId,
        brandsError,
        loadBrandsForCategory,
        loadModelsForBrand,
        refreshBrands,
        ensureBrandVisible,
        ensureModelVisible,
    };
}