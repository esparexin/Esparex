/**
 * Monetization & Advertisement Contract Types (Single Source of Truth)
 */

export type AdProviderType =
  | "google_adsense"
  | "google_ad_manager"
  | "custom_banner"
  | "house_ad";

export const CANONICAL_PLACEMENTS = [
  "homepage_hero_top",
  "homepage_feed_inline",
  "search_results_header",
  "search_results_inline",
  "category_page_header",
  "category_page_inline",
  "listing_details_sidebar",
  "listing_details_incontent",
  "services_page_header",
  "spare_parts_header",
  "business_profile_sidebar",
  "user_dashboard_top",
  "user_my_listings_inline",
  "business_dashboard_top",
  "static_pages_footer",
  "footer_leaderboard",
  "mobile_sticky_bottom",
] as const;

export const LEGACY_PLACEMENT_ALIASES = [
  "listing_detail_sidebar_bottom",
  "listing_detail_below_description",
  "home_below_hero",
  "home_between_sections",
  "browse_in_feed",
  "global_footer",
] as const;

export type CanonicalPlacementId = typeof CANONICAL_PLACEMENTS[number];
export type LegacyPlacementId = typeof LEGACY_PLACEMENT_ALIASES[number];

export type InContentPlacementId = CanonicalPlacementId | LegacyPlacementId;

export const PLACEMENT_ALIASES_MAP: Record<string, CanonicalPlacementId> = {
  home_below_hero: "homepage_hero_top",
  home_between_sections: "homepage_feed_inline",
  browse_in_feed: "search_results_inline",
  listing_detail_sidebar_bottom: "listing_details_sidebar",
  listing_detail_below_description: "listing_details_incontent",
  global_footer: "footer_leaderboard",
};

export const normalizePlacementId = (placementId: string): string => {
  return PLACEMENT_ALIASES_MAP[placementId] || placementId;
};

export const getPlacementEquivalents = (placementId: string): string[] => {
  const canonical = PLACEMENT_ALIASES_MAP[placementId] || placementId;
  const legacyKeys = Object.entries(PLACEMENT_ALIASES_MAP)
    .filter(([_, canon]) => canon === canonical)
    .map(([leg]) => leg);
  return Array.from(new Set([placementId, canonical, ...legacyKeys]));
};

export type AdCampaignStatus = "draft" | "active" | "paused" | "expired";

export type AdFallbackStrategy = "collapse" | "house_ad" | "internal_promo";

export interface AdTargetingCriteria {
  states?: string[];
  cities?: string[];
  categories?: string[];
  device?: "all" | "desktop" | "mobile" | "tablet";
  viewports?: ("desktop" | "tablet" | "mobile")[];
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
  googleFormat?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
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
  fallbackStrategy?: AdFallbackStrategy;
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
