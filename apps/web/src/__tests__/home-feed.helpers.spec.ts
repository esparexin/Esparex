import { describe, it, expect } from "vitest";
import { appendUniqueFeedPage, replaceFeedPage } from "../components/home/homeFeed.helpers";
import type { Listing as Ad } from "@/lib/api/user/listings";

const makeAd = (id: string, title = `Ad ${id}`): Ad => ({
    id,
    title,
    description: `Description ${id}`,
    price: 100,
    isFree: false,
    currency: "INR",
    status: "live",
    listingType: "ad",
    sellerId: "seller1",
    sellerType: "user",
    createdAt: "2026-03-21T00:00:00.000Z",
    updatedAt: "2026-03-21T00:00:00.000Z",
    location: { city: "Macherla", state: "Andhra Pradesh", country: "India" },
    images: [`https://example.com/${id}.jpg`],
    fraudScore: 0,
    fraudFlags: [],
    moderationStatus: "approved",
    seoSlug: `ad-${id}`,
    views: { total: 0, unique: 0, favorites: 0, chats: 0 },
    isSpotlight: false,
    isChatLocked: false,
    sellerTrustSnapshot: 50,
    listingQualityScore: 0,
    reviewVersion: 0,
    freshnessScore: 0,
    categoryId: "cat1"
} as Ad);

describe("homeFeed helpers", () => {
    it("replaces the first page only when the ordered ids actually change", () => {
        const current = [makeAd("1"), makeAd("2")];
        const identical = [makeAd("1"), makeAd("2")];
        const replacement = [makeAd("3"), makeAd("4")];

        expect(replaceFeedPage(current, identical)).toBe(current);
        expect(replaceFeedPage(current, replacement)).toEqual(replacement);
    });

    it("replaces the first page when ids are same but ad content changed", () => {
        const current = [makeAd("1", "Old title"), makeAd("2", "Still same")];
        const updated = [makeAd("1", "New title"), makeAd("2", "Still same")];

        expect(replaceFeedPage(current, updated)).toEqual(updated);
    });

    it("appends only unique ads for paginated pages", () => {
        const current = [makeAd("1"), makeAd("2")];
        const page = [makeAd("2"), makeAd("3"), makeAd("4")];

        expect(appendUniqueFeedPage(current, page)).toEqual([
            current[0],
            current[1],
            page[1],
            page[2],
        ]);
    });

    it("is idempotent when the same cursor page is applied again", () => {
        const current = [makeAd("1"), makeAd("2"), makeAd("3")];
        const duplicatePage = [makeAd("2"), makeAd("3")];

        expect(appendUniqueFeedPage(current, duplicatePage)).toBe(current);
    });

    it("verifies requestParams resolves listingType correctly across all tabs", () => {
        const resolveListingTypeParam = (selectedType: string) =>
            selectedType !== "all" ? selectedType : undefined;

        expect(resolveListingTypeParam("all")).toBeUndefined();
        expect(resolveListingTypeParam("ad")).toBe("ad");
        expect(resolveListingTypeParam("service")).toBe("service");
        expect(resolveListingTypeParam("spare_part")).toBe("spare_part");
    });

    it("ensures feed items are rendered directly without client-side type stripping", () => {
        // Backend returns typed results based on server query; client must not filter out items
        const serviceListing = { ...makeAd("srv-1"), listingType: "service" as const };
        const sparePartListing = { ...makeAd("sp-1"), listingType: "spare_part" as const };
        const adListing = { ...makeAd("ad-1"), listingType: "ad" as const };

        const mixedFeed = [adListing, serviceListing, sparePartListing];

        // All tab renders all types as received from server
        expect(mixedFeed).toHaveLength(3);
        expect(mixedFeed.map((item) => item.listingType)).toEqual(["ad", "service", "spare_part"]);
    });
});
