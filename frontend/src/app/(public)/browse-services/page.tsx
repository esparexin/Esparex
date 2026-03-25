import type { Metadata } from "next";

import { BrowseServices } from "@/components/user/BrowseServices";
import { getServicesPage, type ServiceFilters, type ServicePageResult } from "@/lib/api/user/services";
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
        title: "Browse Services | Esparex",
        description:
            "Find the best mobile and laptop repair services near you on Esparex. Specialized technicians for all major brands.",
        canonicalUrl: "https://esparex.com/browse-services",
        noIndexFilterKeys: ["q", "page", "sort", "category", "minPrice", "maxPrice"],
    });
}

export default async function BrowseServicesPage(props: BrowsePageProps) {
    const data = await loadBrowsePageData<ServiceFilters, ServicePageResult>({
        searchParams: props.searchParams,
        buildFilters: buildStandardCategorySearchFilters,
        fetchPage: getServicesPage,
    });

    return renderBrowsePage(BrowseServices, data);
}
