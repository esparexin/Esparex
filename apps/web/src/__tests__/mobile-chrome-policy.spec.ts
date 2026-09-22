import { describe, expect, it } from "vitest";

import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

describe("mobile chrome policy", () => {
    it("enables the listing action bar across all listing detail route families", () => {
        expect(getMobileChromePolicy("/ads/iphone-15-123").showContextActionBar).toBe(true);
        expect(getMobileChromePolicy("/services/board-repair-123").showContextActionBar).toBe(true);
        expect(getMobileChromePolicy("/spare-part-listings/display-123").showContextActionBar).toBe(true);
    });

    it("suppresses bottom mobile chrome on chat routes", () => {
        expect(getMobileChromePolicy("/chat").showMobileBottomNav).toBe(false);
        expect(getMobileChromePolicy("/chat").showBottomActionsBar).toBe(false);
        expect(getMobileChromePolicy("/chat").hasAnyBottomNav).toBe(false);
        expect(getMobileChromePolicy("/chat/abc123").showMobileBottomNav).toBe(false);
        expect(getMobileChromePolicy("/chat/abc123").showBottomActionsBar).toBe(false);
        expect(getMobileChromePolicy("/chat/abc123").hasAnyBottomNav).toBe(false);
    });

    it("correctly manages mobile chrome policy on account routes", () => {
        const policy = getMobileChromePolicy("/account/wallet");
        expect(policy.showMobileBottomNav).toBe(false); // Public nav is off
        expect(policy.hasAnyBottomNav).toBe(true);      // MobileAccountBottomNav is active
        expect(policy.showMobileSearch).toBe(true);     // Search and notifications accessible on general account routes
        expect(policy.showMobileLocation).toBe(true);
    });

    it("hides search and location selector on /account/profile to reclaim vertical space", () => {
        const profilePolicy = getMobileChromePolicy("/account/profile");
        expect(profilePolicy.showMobileSearch).toBe(false);
        expect(profilePolicy.showMobileLocation).toBe(false);
        expect(profilePolicy.showMobileBottomNav).toBe(false);
        expect(profilePolicy.hasAnyBottomNav).toBe(true);
    });
});
