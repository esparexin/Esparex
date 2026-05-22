"use client";

import { useCallback, useState } from "react";
import logger from "@/lib/logger";
import {
    getSpareParts,
    type SparePart,
} from "@/lib/api/user/masterData";
import {
    normalizeOptionalObjectId,
    sanitizeMongoObjectId,
} from "@/lib/listings/locationUtils";
import {
    LISTING_TYPE,
    type ListingTypeValue,
} from '@esparex/shared';

interface UseSparePartCatalogProps {
    listingType: ListingTypeValue;
    onError?: (msg: string) => void;
}

export function useSparePartCatalog({ listingType, onError }: UseSparePartCatalogProps) {
    const [availableSpareParts, setAvailableSpareParts] = useState<SparePart[]>([]);
    const [isLoadingSpareParts, setIsLoadingSpareParts] = useState(false);
    const [sparePartsError, setSparePartsError] = useState<string | null>(null);

    const loadSparePartsForCategory = useCallback(async (categoryId: string) => {
        const normalizedCategoryId = sanitizeMongoObjectId(categoryId);
        if (!normalizedCategoryId) {
            setAvailableSpareParts([]);
            setSparePartsError(null);
            return;
        }

        setIsLoadingSpareParts(true);
        setSparePartsError(null);

        try {
            const resolvedListingType: ListingTypeValue =
                listingType === LISTING_TYPE.SERVICE ? LISTING_TYPE.AD : listingType;
            const parts = await getSpareParts(normalizedCategoryId, resolvedListingType);
            setAvailableSpareParts(
                parts
                    .map((part) => ({
                        ...part,
                        id: normalizeOptionalObjectId(part.id ?? part._id),
                    }))
                    .filter((part) => typeof part.id === "string" && part.id.length > 0)
            );
            setSparePartsError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to load spare parts";
            logger.error(`[Catalog] Failed to load spare parts for ${normalizedCategoryId}:`, error);
            setAvailableSpareParts([]);
            setSparePartsError(message);
            onError?.(message);
        } finally {
            setIsLoadingSpareParts(false);
        }
    }, [listingType, onError]);

    return {
        availableSpareParts,
        isLoadingSpareParts,
        sparePartsError,
        loadSparePartsForCategory,
    };
}
