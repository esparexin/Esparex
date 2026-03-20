export type MobileVisibility = "show" | "hide" | "on-request";

export type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  gstNumber?: string;
};

export type MobileRequest = {
  id: string;
  buyerName: string;
  adTitle: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
};

export type NotificationPreferences = {
  adUpdates: boolean;
  promotions: boolean;
  emailNotifications: boolean;
};

export type SmartAlertPreferences = {
  email: boolean;
  push: boolean;
  dailySummary: boolean;
  instant: boolean;
};

export type SmartAlertListItem = {
  id: string;
  name: string;
  keywords: string;
  category: string;
  location: string;
  locationId?: string;
  radius?: number;
  lastMatch?: string;
  totalMatches?: number;
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
