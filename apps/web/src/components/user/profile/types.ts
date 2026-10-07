import type { User, UserNotificationSettings } from "@esparex/contracts";
import { MobileVisibilityValue } from "@esparex/contracts";
type MobileVisibility = MobileVisibilityValue;


export type ProfileFieldErrors = {
  name?: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  photo?: string;
};

export type DeleteAccountFieldErrors = {
  reason?: string;
  feedback?: string;
  confirmText?: string;
};


export type ProfileUser = User & {
  businessName?: string;
  gstNumber?: string;
  notificationSettings?: UserNotificationSettings;
  mobileVisibility?: MobileVisibility;
  plan?: string;
};

export type SmartAlertListItem = {
  id: string;
  name: string;
  keywords: string;
  category: string;
  location: string;
  locationId?: string;
  radiusKm?: number;
  lastMatch?: string;
  totalMatches?: number;
  active?: boolean;
  notificationChannels?: string[];
  createdAt?: string;
};

export type SmartAlertItem = SmartAlertListItem;

export type SmartAlertFormData = {
  name: string;
  keywords: string;
  category: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  state?: string;
  location: string;
  locationId?: string | null;
  radiusKm: number;
  notificationChannels: ("email" | "sms" | "push" | "whatsapp" | "in-app")[];
};

export type SmartAlertFieldErrors = {
  name?: string;
  keywords?: string;
  category?: string;
  brand?: string;
  model?: string;
  location?: string;
  radiusKm?: string;
  notificationChannels?: string;
};

/**
 * Phase 3a (§5): `DELETE_ACCOUNT_REASONS` / `DeleteAccountReason` were
 * identical duplicates of the canonical symbols in `@esparex/contracts`
 * (`v1/identity/schema/userProfile.schema`); `DeleteAccountPayload` is
 * relocated to `@esparex/contracts` (canonical owner per DECISION-GATE §3).
 * All three are re-exported here under their historic names so existing
 * importers keep working. Deletion of these shims is Phase 4 (§10).
 */
export { DELETE_ACCOUNT_REASONS } from "@esparex/contracts";
export type { DeleteAccountReason } from "@esparex/contracts";
export type { DeleteAccountPayload } from "@esparex/contracts";

export type ProfilePlanType = "Spotlight" | "More Ads" | "Top Ad" | "Alert Slots";

export type ProfilePlan = {
  id: string;
  name: string;
  price: number;
  duration: string;
  type: ProfilePlanType;
  features: string[];
  popular?: boolean;
};
