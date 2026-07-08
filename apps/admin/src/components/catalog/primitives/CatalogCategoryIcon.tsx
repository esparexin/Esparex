"use client";

import { Box, Briefcase, Smartphone, Wrench as WrenchIcon, Drone, Tv, Laptop, Tablet } from "lucide-react";

export function getListingTypeIcon(type: string, size = 16) {
    const normalizedType = type.trim().replace(/\s+/g, " ").toLowerCase();
    switch (normalizedType) {
        case "ad": case "smartphone": case "mobile": case "mobiles": case "phone": return <Smartphone size={size} aria-hidden="true" focusable="false" />;
        case "service": return <Briefcase size={size} aria-hidden="true" focusable="false" />;
        case "spare_part": return <WrenchIcon size={size} aria-hidden="true" focusable="false" />;
        case "drone": case "drones": return <Drone size={size} aria-hidden="true" focusable="false" />;
        case "laptop": case "laptops": return <Laptop size={size} aria-hidden="true" focusable="false" />;
        case "tablet": case "tablets": case "ipad": return <Tablet size={size} aria-hidden="true" focusable="false" />;
        case "tv": case "tvs": case "led tv": case "led tvs": case "television": case "monitor": return <Tv size={size} aria-hidden="true" focusable="false" />;
        default: return <Box size={size} aria-hidden="true" focusable="false" />;
    }
}

export function CatalogCategoryIcon({ icon, listingType, size = 20 }: { icon?: string; listingType?: string[]; size?: number }) {
    if (icon) return getListingTypeIcon(icon, size);
    return getListingTypeIcon(listingType?.[0] || "ad", size);
}
