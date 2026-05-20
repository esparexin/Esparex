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
    const tab = searchParams.get("tab") || "device-categories";

    switch (tab) {
        case "device-categories":
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
