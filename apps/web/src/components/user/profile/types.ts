import type { User, UserNotificationSettings } from "@/types/User";
import { MobileVisibilityValue } from "@esparex/contracts";
export type MobileVisibility = MobileVisibilityValue;

export type ProfileFormData = {
  name: string;
  email: string;
  businessName?: string;
  gstNumber?: string;
};

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

export type NotificationPreferences = {
  adUpdates: boolean;
  promotions: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  instantAlerts: boolean;
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
  notificationChannels: ("email" | "sms" | "push")[];
};

export type SmartAlertFieldErrors = {
  name?: string;
  keywords?: string;
  category?: string;
  location?: string;
  radiusKm?: string;
  notificationChannels?: string;
};

export const DELETE_ACCOUNT_REASONS = [
  "not_useful",
  "privacy_concerns",
  "too_many_emails",
  "found_alternative",
  "other",
] as const;

export type DeleteAccountReason = (typeof DELETE_ACCOUNT_REASONS)[number];

export type DeleteAccountPayload = {
  reason: DeleteAccountReason;
  feedback?: string;
};

export type ProfilePlanType = "Spotlight" | "More Ads" | "Alert Slots";

export type ProfilePlan = {
  id: string;
  name: string;
  price: number;
  duration: string;
  type: ProfilePlanType;
  features: string[];
  popular?: boolean;
};

export type MyAdsStatus =
  | "live"
  | "pending"
  | "rejected"
  | "sold"
  | "expired"
  | "deactivated";
