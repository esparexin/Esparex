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
        const walletPolicy = getMobileChromePolicy("/account/wallet");
        expect(walletPolicy.showMobileBottomNav).toBe(false); // Public nav is off
        expect(walletPolicy.hasAnyBottomNav).toBe(true);      // MobileAccountBottomNav is active
        expect(walletPolicy.showMobileSearch).toBe(false);    // Suppressed to reclaim vertical space
        expect(walletPolicy.showMobileLocation).toBe(false);  // Suppressed to reclaim vertical space

        const rootPolicy = getMobileChromePolicy("/account");
        expect(rootPolicy.showMobileSearch).toBe(false);
        expect(rootPolicy.showMobileLocation).toBe(false);
        expect(rootPolicy.hasAnyBottomNav).toBe(true);
    });

    it("hides search and location selector on /account/profile to reclaim vertical space", () => {
        const profilePolicy = getMobileChromePolicy("/account/profile");
        expect(profilePolicy.showMobileSearch).toBe(false);
        expect(profilePolicy.showMobileLocation).toBe(false);
        expect(profilePolicy.showMobileBottomNav).toBe(false);
        expect(profilePolicy.hasAnyBottomNav).toBe(true);
    });
});
