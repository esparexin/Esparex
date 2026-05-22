"use client";

import { useEffect, useMemo } from "react";
import logger from "@/lib/logger";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import type { ListingTypeValue } from '@esparex/shared';
import { useCategoriesQuery } from "@/hooks/queries/useCategoriesQuery";
import { buildDynamicCategories } from "./catalogShared";

interface UseListingCategoriesProps {
    listingType: ListingTypeValue;
    onError?: (msg: string) => void;
}

export function useListingCategories({ listingType, onError }: UseListingCategoriesProps) {
    const { data: categories = [], error: categoriesError } = useCategoriesQuery();

    const dynamicCategories = useMemo(
        () => buildDynamicCategories(categories, listingType),
        [categories, listingType]
    );

    const categoryMap = useMemo(
        () => Object.fromEntries(dynamicCategories.map((category) => [category.id, category])),
        [dynamicCategories]
    );

    useEffect(() => {
        if (!categoriesError) return;
        logger.error(`[Catalog] Failed to load categories for ${listingType}`, categoriesError);
        onError?.(TOAST_MESSAGES.LOAD_FAILED);
    }, [categoriesError, listingType, onError]);

    return {
        dynamicCategories,
        categoryMap,
    };
}
