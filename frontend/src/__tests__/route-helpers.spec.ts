import { describe, expect, it } from "vitest";

import { buildAuthCallbackUrl, buildLoginUrl, normalizeAuthCallbackUrl } from "@/lib/authHelpers";
import { buildPublicBrowseRoute, parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

describe("route helpers", () => {
    it("preserves query params in auth callbacks while stripping nested callbackUrl", () => {
        expect(
            buildAuthCallbackUrl("/account/ads", "status=pending&callbackUrl=%2Funsafe")
        ).toBe("/account/ads?status=pending");
    });

    it("builds safe login URLs from normalized callbacks", () => {
        expect(buildLoginUrl("//evil.com")).toBe("/login?callbackUrl=%2F");
        expect(buildLoginUrl("/account/ads?status=pending")).toBe(
            "/login?callbackUrl=%2Faccount%2Fads%3Fstatus%3Dpending"
        );
        expect(normalizeAuthCallbackUrl("/search?q=iphone")).toBe("/search?q=iphone");
    });

    it("builds canonical browse routes with explicit type and preserved filters", () => {
        expect(
            buildPublicBrowseRoute({
                type: "service",
                q: "screen replacement",
                category: "services",
                sort: "price_low_high",
                radiusKm: 25,
            })
        ).toBe("/search?type=service&q=screen+replacement&category=services&sort=price_low_high&radiusKm=25");
    });

    it("parses browse params and preserves categoryId separately", () => {
        const parsed = parsePublicBrowseParams(
            new URLSearchParams("type=spare_part&categoryId=507f1f77bcf86cd799439011&q=iphone")
        );

        expect(parsed.type).toBe("spare_part");
        expect(parsed.categoryId).toBe("507f1f77bcf86cd799439011");
        expect(parsed.q).toBe("iphone");
    });

    it("builds canonical listing detail routes across listing types", () => {
        expect(
            buildPublicListingDetailRoute({
                listingType: "ad",
                id: "507f1f77bcf86cd799439011",
                title: "iPhone 15 Pro Max",
            })
        ).toBe("/ads/iphone-15-pro-max-507f1f77bcf86cd799439011");

        expect(
            buildPublicListingDetailRoute({
                listingType: "service",
                id: "svc-123",
                seoSlug: "board-repair",
            })
        ).toBe("/services/board-repair-svc-123");
    });
});
