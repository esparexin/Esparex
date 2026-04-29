import type { LucideIcon } from "lucide-react";
import type { GeoJSONPoint } from "@/types/location";
import { UserPage } from "@/lib/routeUtils";

export interface CategoryData {
    id: string;
    name: string;
    slug: string;
    icon?: LucideIcon;
    // Metadata-driven architecture fields
    hasScreenSizes?: boolean;
    supportsSpareParts?: boolean;
    listingType?: string[];
}

export type LocationCoordinates = GeoJSONPoint;

export interface Brand {
    id?: string;
    name: string;
}

export interface AdImage {
    id: string;
    preview: string;
    file?: File;
    isRemote: boolean;
    hash?: string;
}

export interface PostAdLocationMeta {
    city?: string;
    state?: string;
    id?: string;
}

export interface PostAdWizardProps {
  navigateTo: (
    page: UserPage,
    adId?: string | number,
    category?: string,
    businessId?: string,
    serviceId?: string
  ) => void;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
  editAdId?: string;
}
