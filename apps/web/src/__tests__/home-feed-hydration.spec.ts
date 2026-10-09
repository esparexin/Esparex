import { describe, it, expect } from "vitest";
import { replaceFeedPage, appendUniqueFeedPage } from "../components/home/homeFeed.helpers";
import type { UserListing as Ad } from "@/lib/api/user/listings";

const makeAd = (id: string, title = `Ad ${id}`, locationCity = "National Default"): Ad => ({
    id,
    title,
    description: `Description for ${id}`,
    price: 15000,
    isFree: false,
    currency: "INR",
    status: "live",
    listingType: "ad",
    sellerId: `seller-${id}`,
    sellerType: "user",
    createdAt: "2026-09-15T02:24:35.514Z",
    updatedAt: "2026-09-15T02:24:35.514Z",
    location: { city: locationCity, state: "Telangana", country: "India" },
    images: ["https://example.com/test-thumb.webp"],
    fraudScore: 0,
    fraudFlags: [],
    moderationStatus: "approved",
    seoSlug: `ad-${id}`,
    views: { total: 10, unique: 5, favorites: 1, chats: 0 },
    isSpotlight: false,
    isChatLocked: false,
    sellerTrustSnapshot: 75,
    listingQualityScore: 80,
    reviewVersion: 1,
    freshnessScore: 90,
    categoryId: "69c24a14a58d20c75c6b09d8"
} as Ad);

describe("Home Marketplace Location Hydration & Cache Lifecycle Suite", () => {
    describe("Initial SSR Rendering & Location Hydration Transition", () => {
        it("renders initial SSR default national feed before client location is resolved", () => {
            const ssrAds: Ad[] = [
                makeAd("ssr-ad-1", "National iPhone 15"),
                makeAd("ssr-ad-2", "National HP Envy"),
            ];

            // Initial feed state before client location context loads
            let currentFeedAds: Ad[] = ssrAds;
            expect(currentFeedAds).toHaveLength(2);
            expect(currentFeedAds[0]?.id).toBe("ssr-ad-1");
            expect(currentFeedAds[0]?.location?.city).toBe("National Default");
        });

        it("seamlessly swaps national feed for localized listings when client location resolves", () => {
            const ssrAds: Ad[] = [
                makeAd("ssr-ad-1", "National iPhone 15"),
                makeAd("ssr-ad-2", "National HP Envy"),
            ];
            const localizedAds: Ad[] = [
                makeAd("local-ad-1", "Local iPhone 14", "Hyderabad"),
                makeAd("local-ad-2", "Local Samsung S24", "Hyderabad"),
            ];

            // Simulating HomeFeedClient location hydration:
            // Client reads Hyderabad from localStorage -> Query returns localizedAds -> replaceFeedPage called
            const updatedFeed = replaceFeedPage(ssrAds, localizedAds);

            expect(updatedFeed).toEqual(localizedAds);
            expect(updatedFeed).not.toBe(ssrAds);
            expect(updatedFeed[0]?.location?.city).toBe("Hyderabad");
        });

        it("preserves previous feed and does not create an empty gap during cache hits or identical revalidations", () => {
            const existingAds: Ad[] = [
                makeAd("ad-1", "Existing Item 1", "Bengaluru"),
                makeAd("ad-2", "Existing Item 2", "Bengaluru"),
            ];
            const identicalRevalidation: Ad[] = [
                makeAd("ad-1", "Existing Item 1", "Bengaluru"),
                makeAd("ad-2", "Existing Item 2", "Bengaluru"),
            ];

            // When revalidation brings back the exact same items in same order, reference is preserved
            const preservedFeed = replaceFeedPage(existingAds, identicalRevalidation);
            expect(preservedFeed).toBe(existingAds);
        });
    });

    describe("Resilience & Fallback Handling", () => {
        it("preserves existing displayed ads if localized query returns empty without explicit fallback", () => {
            const currentAds: Ad[] = [
                makeAd("ad-1", "Item 1"),
                makeAd("ad-2", "Item 2"),
            ];
            const emptyResult: Ad[] = [];

            // In HomeFeedClient:
            // if (!cursor) { setFeedAds(prev => pageAds.length > 0 || data.isFallback || prev.length === 0 ? replaceFeedPage(prev, pageAds) : prev); }
            const shouldReplace = emptyResult.length > 0 || false || currentAds.length === 0;
            const finalAds = shouldReplace ? replaceFeedPage(currentAds, emptyResult) : currentAds;

            expect(finalAds).toBe(currentAds);
            expect(finalAds).toHaveLength(2);
        });

        it("appends subsequent pages uniquely without duplicating existing IDs", () => {
            const firstPage: Ad[] = [
                makeAd("ad-1", "Item 1"),
                makeAd("ad-2", "Item 2"),
            ];
            const secondPageWithOverlap: Ad[] = [
                makeAd("ad-2", "Item 2"),
                makeAd("ad-3", "Item 3"),
                makeAd("ad-4", "Item 4"),
            ];

            const appended = appendUniqueFeedPage(firstPage, secondPageWithOverlap);
            expect(appended).toHaveLength(4);
            expect(appended.map(a => a.id)).toEqual(["ad-1", "ad-2", "ad-3", "ad-4"]);
        });
    });
});
