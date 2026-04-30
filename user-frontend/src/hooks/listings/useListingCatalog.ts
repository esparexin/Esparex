"use client";

import type { ListingTypeValue } from "@esparex/shared/enums/listingType";
import { useBrandCatalog } from "./useBrandCatalog";
import { useCategorySchemaCatalog } from "./useCategorySchemaCatalog";
import { useListingCategories } from "./useListingCategories";
import { useServiceTypeCatalog } from "./useServiceTypeCatalog";
import { useSparePartCatalog } from "./useSparePartCatalog";

interface UseListingCatalogProps {
    listingType: ListingTypeValue;
    onError?: (msg: string) => void;
}

export function useListingCatalog({ listingType, onError }: UseListingCatalogProps) {
    const categoryCatalog = useListingCategories({ listingType, onError });
    const brandCatalog = useBrandCatalog({
        categoryMap: categoryCatalog.categoryMap,
        onError,
    });
    const serviceTypeCatalog = useServiceTypeCatalog({ onError });
    const sparePartCatalog = useSparePartCatalog({ listingType, onError });
    const categorySchemaCatalog = useCategorySchemaCatalog();

    return {
        ...categoryCatalog,
        ...brandCatalog,
        ...serviceTypeCatalog,
        ...sparePartCatalog,
        ...categorySchemaCatalog,
    };
}
