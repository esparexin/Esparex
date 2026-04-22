"use client";

import { useCallback, useState } from "react";
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

export function useBrandCatalog({
    categoryMap,
    onError,
    includeScreenSizes = true,
}: UseBrandCatalogProps) {
    const [brandMap, setBrandMap] = useState<Record<string, Brand>>({});
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
    const [availableSizes, setAvailableSizes] = useState<string[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string>("");
    const [brandsError, setBrandsError] = useState<string | null>(null);

    const loadBrandsForCategory = useCallback(async (categoryId: string) => {
        const normalizedCategoryId = sanitizeMongoObjectId(categoryId);
        if (!normalizedCategoryId) {
            setActiveCategoryId("");
            setBrandMap({});
            setAvailableBrands([]);
            setAvailableSizes([]);
            return;
        }

        setActiveCategoryId(normalizedCategoryId);

        try {
            const category = categoryMap[normalizedCategoryId];
            const normalizedCategoryText = `${category?.slug ?? ""} ${category?.name ?? ""}`.toLowerCase();
            const shouldLoadScreenSizes =
                includeScreenSizes &&
                (
                    Boolean(category?.hasScreenSizes) ||
                    normalizedCategoryText.includes("tv") ||
                    normalizedCategoryText.includes("monitor")
                );

            const [brandsData, sizesData] = await Promise.all([
                getBrands(normalizedCategoryId),
                shouldLoadScreenSizes ? getScreenSizes(normalizedCategoryId) : Promise.resolve([]),
            ]);

            const nextBrandMap: Record<string, Brand> = {};
            brandsData.forEach((brand) => {
                nextBrandMap[brand.name] = brand;
            });

            setBrandMap(nextBrandMap);
            setAvailableBrands(brandsData.map((brand) => brand.name));
            setAvailableSizes(shouldLoadScreenSizes ? normalizeScreenSizeOptions(sizesData) : []);
            setBrandsError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load brands";
            logger.error(`[Catalog] Failed to load brands for ${normalizedCategoryId}:`, error);
            setAvailableBrands([]);
            setAvailableSizes([]);
            setBrandsError(message);
            onError?.(message);
        }
    }, [categoryMap, includeScreenSizes, onError]);

    const loadModelsForBrand = useCallback(async (brandId?: string, categoryId?: string, search?: string) => {
        if (!brandId) {
            setAvailableModels([]);
            return;
        }

        try {
            const models = await getModels(brandId, categoryId, search);
            setAvailableModels((previous) => {
                const pendingOnly = previous.filter((model) => model.status === "pending");
                const existingIds = new Set(models.map((model) => String(model.id || model._id)));
                const uniquePending = pendingOnly.filter((model) => !existingIds.has(String(model.id || model._id)));
                return [...models, ...uniquePending];
            });
        } catch (error) {
            logger.error(`[Catalog] Failed to load models for brand ${brandId}:`, error);
            setAvailableModels([]);
            onError?.("Failed to load models");
        }
    }, [onError]);

    const refreshBrands = useCallback(async () => {
        if (!activeCategoryId) return;
        await loadBrandsForCategory(activeCategoryId);
    }, [activeCategoryId, loadBrandsForCategory]);

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
