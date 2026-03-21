import { describe, expect, it } from "vitest";
import { appendUniqueFeedPage, replaceFeedPage } from "@/components/home/homeFeed.helpers";
import type { Ad } from "@/api/user/ads";

const makeAd = (id: string, title = `Ad ${id}`): Ad =>
    ({
        id,
        title,
        description: `Description ${id}`,
        price: 100,
        status: "live",
        createdAt: "2026-03-21T00:00:00.000Z",
        updatedAt: "2026-03-21T00:00:00.000Z",
        location: { city: "Macherla" },
        sellerName: "Esparex Seller",
        time: "3/21/2026",
        images: [`https://example.com/${id}.jpg`],
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
            makeAd("1"),
            makeAd("2"),
            makeAd("3"),
            makeAd("4"),
        ]);
    });

    it("is idempotent when the same cursor page is applied again", () => {
        const current = [makeAd("1"), makeAd("2"), makeAd("3")];
        const duplicatePage = [makeAd("2"), makeAd("3")];

        expect(appendUniqueFeedPage(current, duplicatePage)).toBe(current);
    });
});
