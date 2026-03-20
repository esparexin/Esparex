import type { LucideIcon } from "lucide-react";
import type { GeoJSONPoint } from "@/types/location";

export interface ListingImage {
    id: string;
    preview: string;
    file?: File;
    isRemote: boolean;
    hash?: string;
}

export interface ListingCategory {
    id: string;
    name: string;
    slug: string;
    icon?: LucideIcon;
    hasScreenSizes?: boolean;
    supportsSpareParts?: boolean;
    listingType?: string[];
    serviceSelectionMode?: 'single' | 'multi';
}

export interface ListingLocation {
    display: string;
    city: string;
    state: string;
    country?: string;
    locationId?: string;
    coordinates?: GeoJSONPoint;
}
