import type { LucideIcon } from "lucide-react";
import type { GeoJSONPoint } from "@/types/location";
import { UserPage } from "@/lib/routeUtils";











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
