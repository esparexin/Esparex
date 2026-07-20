import type { LucideIcon } from "lucide-react";

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

export type { ListingLocation } from "@esparex/contracts";
