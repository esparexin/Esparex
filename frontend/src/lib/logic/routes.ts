import type { UserPage } from "@/lib/routeUtils";

/**
 * Compatibility route-key constants.
 *
 * Canonical page-to-path mapping lives in `lib/routeUtils.ts`.
 * Keep this file for legacy imports to prevent route-key drift during migration.
 */
export const ROUTES = {
    HOME: "home",
    BROWSE: "browse",
    CATEGORY: "category",
    POST_AD: "post-ad",
    LOGIN: "login",
    AD_DETAIL: "ad-detail",
    MY_ADS: "my-ads",
    SAVED_ADS: "saved-ads",
    MESSAGES: "messages",
    PROFILE_SETTINGS: "profile-settings",
    PUBLIC_PROFILE: "public-profile",
    EDIT_AD: "edit-ad",
} as const satisfies Record<string, UserPage>;

export type RouteKey = typeof ROUTES[keyof typeof ROUTES];
