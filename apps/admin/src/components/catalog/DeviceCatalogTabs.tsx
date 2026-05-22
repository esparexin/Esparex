"use client";

import { useSearchParams } from "next/navigation";
import CategoriesTab from "./tabs/CategoriesTab";
import BrandsTab from "./tabs/BrandsTab";
import ModelsTab from "./tabs/ModelsTab";
import ScreenSizesTab from "./tabs/ScreenSizesTab";
import ServiceTypesTab from "./tabs/ServiceTypesTab";
import SparePartsTab from "./tabs/SparePartsTab";
import CatalogRequestsTab from "./tabs/CatalogRequestsTab";

export default function DeviceCatalogTabs() {
    const searchParams = useSearchParams();
    const rawTab = searchParams.get("tab") || "categories";
    // Backward-compat: normalize legacy 'device-categories' → 'categories'
    const tab = rawTab === "device-categories" ? "categories" : rawTab;

    switch (tab) {
        case "categories":
            return <CategoriesTab />;
        case "brands":
            return <BrandsTab />;
        case "models":
            return <ModelsTab />;
        case "screen-sizes":
            return <ScreenSizesTab />;
        case "service-types":
            return <ServiceTypesTab />;
        case "spare-parts":
            return <SparePartsTab />;
        case "catalog-requests":
            return <CatalogRequestsTab />;
        default:
            return <CategoriesTab />;
    }
}
