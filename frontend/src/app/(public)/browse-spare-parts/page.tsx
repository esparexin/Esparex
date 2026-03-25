import type { Metadata } from "next";

import { BrowseSpareParts } from "@/components/user/BrowseSpareParts";
import {
    getSparePartListingsPage,
    type SparePartListingFilters,
    type SparePartListingPageResult,
} from "@/lib/api/user/sparePartListings";
import {
    buildStandardCategorySearchFilters,
    buildBrowsePageMetadata,
    loadBrowsePageData,
    renderBrowsePage,
    type BrowsePageProps,
} from "@/lib/listings/browseServerPage";

export const revalidate = 60; // Hardcoded to satisfy Next.js segment config

export async function generateMetadata(props: BrowsePageProps): Promise<Metadata> {
    return buildBrowsePageMetadata(props, {
        title: "Browse Spare Parts | Esparex",
        description: "Find spare parts for mobiles and laptops on Esparex. Quality parts from verified sellers.",
        canonicalUrl: "https://esparex.com/browse-spare-parts",
        noIndexFilterKeys: ["q", "page", "sort", "category"],
    });
}

export default async function BrowseSparePartsPage(props: BrowsePageProps) {
    const data = await loadBrowsePageData<SparePartListingFilters, SparePartListingPageResult>({
        searchParams: props.searchParams,
        buildFilters: buildStandardCategorySearchFilters,
        fetchPage: getSparePartListingsPage,
    });

    return renderBrowsePage(BrowseSpareParts, data);
}
