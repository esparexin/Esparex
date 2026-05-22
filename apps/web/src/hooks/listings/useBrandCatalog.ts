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
                const models = await getModels(
                    selectedBrandId,
                    activeCategoryId || undefined,
                    modelSearch || undefined
                );

                // Preserve pending models already injected into cache.
                const previous =
                    queryClient.getQueryData<DeviceModel[]>([
                        "catalog",
                        "models",
                        activeCategoryId,
                        selectedBrandId,
                        modelSearch,
                    ]) ?? [];

                const pendingOnly = previous.filter(
                    (model) => model.status === "pending"
                );

                const existingIds = new Set(
                    models.map((model) =>
                        String(model.id || model._id)
                    )
                );

                const uniquePending = pendingOnly.filter(
                    (model) =>
                        !existingIds.has(
                            String(model.id || model._id)
                        )
                );

                return [...models, ...uniquePending];
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
     * Backward compatibility setter.
     * Allows callers to inject temporary pending models.
     */
    const setAvailableModels = useCallback(
        (
            updater:
                | DeviceModel[]
                | ((
                    previous: DeviceModel[]
                ) => DeviceModel[])
        ) => {
            const queryKey = [
                "catalog",
                "models",
                activeCategoryId,
                selectedBrandId,
                modelSearch,
            ] as const;

            queryClient.setQueryData<DeviceModel[]>(
                queryKey,
                (previous = []) =>
                    typeof updater === "function"
                        ? updater(previous)
                        : updater
            );

            // Double inject into default empty search query key to prevent models disappearing when search is cleared
            if (modelSearch !== "") {
                const emptyQueryKey = [
                    "catalog",
                    "models",
                    activeCategoryId,
                    selectedBrandId,
                    "",
                ] as const;

                queryClient.setQueryData<DeviceModel[]>(
                    emptyQueryKey,
                    (previous = []) =>
                        typeof updater === "function"
                            ? updater(previous)
                            : updater
                );
            }
        },
        [
            activeCategoryId,
            selectedBrandId,
            modelSearch,
            queryClient,
        ]
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
        setAvailableModels,
    };
}