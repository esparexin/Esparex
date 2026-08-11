import { z } from "zod";

export const AD_PLACEMENT_LOCATION = {
    HOMEPAGE_HERO: "homepage_hero_top",
    HOMEPAGE_FEED: "homepage_feed_inline",
    SEARCH_RESULTS_HEADER: "search_results_header",
    SEARCH_RESULTS_INLINE: "search_results_inline",
    LISTING_DETAILS_SIDEBAR: "listing_details_sidebar",
    LISTING_DETAILS_INCONTENT: "listing_details_incontent",
    FOOTER_LEADERBOARD: "footer_leaderboard",
    MOBILE_STICKY_BOTTOM: "mobile_sticky_bottom",
} as const;

export type AdPlacementLocationValue = typeof AD_PLACEMENT_LOCATION[keyof typeof AD_PLACEMENT_LOCATION];

export const AD_FORMAT = {
    LEADERBOARD_728x90: "728x90",
    RECTANGLE_300x250: "300x250",
    HALF_PAGE_300x600: "300x600",
    MOBILE_BANNER_320x50: "320x50",
    RESPONSIVE_AUTO: "responsive",
    FLUID_NATIVE: "fluid",
} as const;

export type AdFormatValue = typeof AD_FORMAT[keyof typeof AD_FORMAT];

export const GOOGLE_AD_STATUS = {
    ACTIVE: "active",
    PAUSED: "paused",
    SCHEDULED: "scheduled",
    DRAFT: "draft",
    ARCHIVED: "archived",
} as const;

export type GoogleAdStatusValue = typeof GOOGLE_AD_STATUS[keyof typeof GOOGLE_AD_STATUS];

export const AD_FALLBACK_STRATEGY = {
    COLLAPSE: "collapse",
    INTERNAL_PROMO: "internal_promo",
} as const;

export type AdFallbackStrategyValue = typeof AD_FALLBACK_STRATEGY[keyof typeof AD_FALLBACK_STRATEGY];

export interface GoogleAdPlacementDTO {
    id: string;
    placementKey: string;
    name: string;
    adSlotId: string;
    publisherClientId?: string;
    location: AdPlacementLocationValue;
    format: AdFormatValue;
    status: GoogleAdStatusValue;
    viewports: ("desktop" | "tablet" | "mobile")[];
    priority: number;
    fallbackStrategy: AdFallbackStrategyValue;
    fallbackImageUri?: string;
    fallbackTargetUrl?: string;
    startDate?: string;
    endDate?: string;
    impressionsCount?: number;
    clicksCount?: number;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const createGoogleAdPlacementSchema = z.object({
    placementKey: z.string().min(3).max(64).regex(/^[a-z0-9_]+$/i, "Placement key must be alphanumeric with underscores"),
    name: z.string().min(2).max(100),
    adSlotId: z.string().min(5).max(32),
    publisherClientId: z.string().optional(),
    location: z.enum([
        AD_PLACEMENT_LOCATION.HOMEPAGE_HERO,
        AD_PLACEMENT_LOCATION.HOMEPAGE_FEED,
        AD_PLACEMENT_LOCATION.SEARCH_RESULTS_HEADER,
        AD_PLACEMENT_LOCATION.SEARCH_RESULTS_INLINE,
        AD_PLACEMENT_LOCATION.LISTING_DETAILS_SIDEBAR,
        AD_PLACEMENT_LOCATION.LISTING_DETAILS_INCONTENT,
        AD_PLACEMENT_LOCATION.FOOTER_LEADERBOARD,
        AD_PLACEMENT_LOCATION.MOBILE_STICKY_BOTTOM,
    ]),
    format: z.enum([
        AD_FORMAT.LEADERBOARD_728x90,
        AD_FORMAT.RECTANGLE_300x250,
        AD_FORMAT.HALF_PAGE_300x600,
        AD_FORMAT.MOBILE_BANNER_320x50,
        AD_FORMAT.RESPONSIVE_AUTO,
        AD_FORMAT.FLUID_NATIVE,
    ]),
    status: z.enum([
        GOOGLE_AD_STATUS.ACTIVE,
        GOOGLE_AD_STATUS.PAUSED,
        GOOGLE_AD_STATUS.SCHEDULED,
        GOOGLE_AD_STATUS.DRAFT,
        GOOGLE_AD_STATUS.ARCHIVED,
    ]).default(GOOGLE_AD_STATUS.ACTIVE),
    viewports: z.array(z.enum(["desktop", "tablet", "mobile"])).min(1),
    priority: z.number().int().min(0).default(0),
    fallbackStrategy: z.enum([
        AD_FALLBACK_STRATEGY.COLLAPSE,
        AD_FALLBACK_STRATEGY.INTERNAL_PROMO,
    ]).default(AD_FALLBACK_STRATEGY.COLLAPSE),
    fallbackImageUri: z.string().optional(),
    fallbackTargetUrl: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const updateGoogleAdPlacementSchema = createGoogleAdPlacementSchema.partial();
