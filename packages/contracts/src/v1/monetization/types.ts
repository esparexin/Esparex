/**
 * Monetization & Advertisement Contract Types (Single Source of Truth)
 */

export type AdProviderType =
  | "google_adsense"
  | "google_ad_manager"
  | "custom_banner"
  | "house_ad";

export type InContentPlacementId =
  | "listing_detail_sidebar_bottom"
  | "listing_detail_below_description"
  | "home_below_hero"
  | "home_between_sections"
  | "browse_in_feed"
  | "global_footer";

export type AdCampaignStatus = "draft" | "active" | "paused" | "expired";

export interface AdTargetingCriteria {
  states?: string[];
  cities?: string[];
  categories?: string[];
  device?: "all" | "desktop" | "mobile" | "tablet";
  userType?: "all" | "authenticated" | "guest" | "business";
}

export interface AdFrequencyConfig {
  interval?: number; // e.g. every 8 cards in browse feed
  maxPerPage?: number; // e.g. maximum 2 ads per page view
}

export interface AdRenderingRules {
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
  aspectRatio?: string;
  responsive: boolean;
  spacingMarginY?: string;
}

export interface AdProviderConfig {
  googleSlotId?: string;
  googlePublisherId?: string;
  googleFormat?: "auto" | "rectangle" | "horizontal";
  bannerImageUrl?: string;
  bannerTargetUrl?: string;
  bannerAltText?: string;
  openInNewTab?: boolean;
  trackingPixelUrl?: string;
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  lastServedAt?: string;
}

export interface AdCampaignItem {
  id: string;
  name: string;
  placementId: InContentPlacementId;
  providerType: AdProviderType;
  priority: number; // 1 = highest, 2 = secondary fallback, 3 = tertiary house ad
  status: AdCampaignStatus;
  startAt?: string; // ISO 8601
  endAt?: string; // ISO 8601
  targeting: AdTargetingCriteria;
  frequency?: AdFrequencyConfig;
  rendering?: AdRenderingRules;
  providerConfig: AdProviderConfig;
  metrics?: AdMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface MonetizationSystemState {
  featureEnabled: boolean; // Module availability flag
  publishingEnabled: boolean; // Live public serving flag
  providers: {
    googleAdsense?: {
      publisherId: string;
      autoAdsEnabled: boolean;
    };
    googleAdManager?: {
      networkCode: string;
    };
  };
}

export interface ResolveAdRequest {
  placementId: InContentPlacementId;
  device?: "desktop" | "mobile" | "tablet";
  location?: {
    state?: string;
    city?: string;
  };
  category?: string;
  isAuthenticated?: boolean;
  isBusiness?: boolean;
}

export interface ResolveAdResponse {
  ad: AdCampaignItem | null;
  fallbackAd: AdCampaignItem | null;
  renderedProvider: AdProviderType | "none";
}
