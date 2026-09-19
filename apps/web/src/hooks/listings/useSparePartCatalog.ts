"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logger from "@/lib/logger";
import {
    getSpareParts,
    type SparePart,
} from "@/lib/api/user/masterData";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
import { sanitizeMongoObjectId } from "@esparex/shared";
import { LISTING_TYPE, ListingTypeValue } from "@esparex/contracts";

interface UseSparePartCatalogProps {
    listingType: ListingTypeValue;
    onError?: (msg: string) => void;
}

const SPARE_PARTS_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Manages spare part catalog data for the Post Ad / Edit Ad form.
 *
 * CATEGORY ISOLATION (architectural rule):
 * Each React Query entry is keyed by ["catalog", "spare-parts", categoryId, listingType].
 * This guarantees:
 *   - Results for Category A can never overwrite results for Category B.
 *   - Concurrent calls to loadSparePartsForCategory() are automatically
 *     deduplicated — only one network request fires per unique category+type.
 *   - Stale results from a previous category cannot overwrite a newer category
 *     because each category has a fully isolated cache entry.
 *   - Switching categories clears displayed data immediately (the new key has
 *     no cached result yet), preventing cross-category leakage in the UI.
 *
 * DO NOT revert this to imperative useState + fetch. The previous implementation
 * caused a race condition where slower responses for earlier categories could
 * overwrite the correct data for the currently-selected category.
 */
export function useSparePartCatalog({ listingType, onError }: UseSparePartCatalogProps) {
    const queryClient = useQueryClient();

    // activeCategoryId is the single source of truth for which category's
    // spare parts are being displayed. It is only mutated by loadSparePartsForCategory.
    const [activeCategoryId, setActiveCategoryId] = useState<string>("");

    const resolvedListingType: ListingTypeValue =
        listingType === LISTING_TYPE.SERVICE ? LISTING_TYPE.AD : listingType;

    /**
     * Spare Parts Query.
     * Isolated per category + listingType. Automatic deduplication and stale-time protection.
     */
    const sparePartsQuery = useQuery({
        queryKey: ["catalog", "spare-parts", activeCategoryId, resolvedListingType],
        enabled: Boolean(activeCategoryId),
        staleTime: SPARE_PARTS_STALE_TIME,
        gcTime: SPARE_PARTS_STALE_TIME,
        queryFn: async () => {
            try {
                const parts = await getSpareParts(activeCategoryId, resolvedListingType);
                return parts
                    .map((part) => ({
                        ...part,
                        id: normalizeOptionalObjectId(part.id ?? part._id),
                    }))
                    .filter((part): part is SparePart & { id: string } =>
                        typeof part.id === "string" && part.id.length > 0
                    );
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to load spare parts";
                logger.error(`[Catalog] Failed to load spare parts for ${activeCategoryId}:`, error);
                onError?.(message);
                throw error;
            }
        },
    });

    /**
     * Preserve existing imperative API contract.
     * Consumers still call loadSparePartsForCategory().
     * React Query handles the actual fetching, caching, and deduplication.
     *
     * CATEGORY OWNERSHIP RULE: This is the ONLY function permitted to update
     * activeCategoryId. It sets the query key, which React Query uses to
     * fetch, cache, and serve the correct category's spare parts in isolation.
     */
    const loadSparePartsForCategory = useCallback((categoryId: string): Promise<void> => {
        const normalizedCategoryId = sanitizeMongoObjectId(categoryId);
        if (!normalizedCategoryId) {
            setActiveCategoryId("");
            return Promise.resolve();
        }
        setActiveCategoryId(normalizedCategoryId);
        return Promise.resolve();
    }, []);

    /**
     * Manual refresh — invalidates the current category's cache entry.
     */
    const refreshSpareParts = useCallback(async () => {
        if (!activeCategoryId) return;
        await queryClient.invalidateQueries({
            queryKey: ["catalog", "spare-parts", activeCategoryId, resolvedListingType],
        });
    }, [activeCategoryId, queryClient, resolvedListingType]);

    const availableSpareParts = sparePartsQuery.data ?? [];
    const isLoadingSpareParts = sparePartsQuery.isLoading || sparePartsQuery.isFetching;
    const sparePartsError = sparePartsQuery.error instanceof Error
        ? sparePartsQuery.error.message
        : sparePartsQuery.error
            ? "Failed to load spare parts"
            : null;

    return {
        availableSpareParts,
        isLoadingSpareParts,
        sparePartsError,
        activeCategoryId,
        loadSparePartsForCategory,
        refreshSpareParts,
    };
}
