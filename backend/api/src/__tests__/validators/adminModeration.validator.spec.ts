import {
    adminModerationListingsQuerySchema,
    adminReportedAdsQuerySchema,
} from "@esparex/core/validators/adminModeration.validator";

describe("adminModerationListingsQuerySchema", () => {
    it("accepts canonical moderation query filters", () => {
        const parsed = adminModerationListingsQuerySchema.parse({
            q: "battery repair",
            sellerId: "65f0a1b2c3d4e5f607182930",
            locationId: "65f0a1b2c3d4e5f607182931",
            status: "live",
            page: "2",
            limit: "20",
            sortBy: "newest",
        });

        expect(parsed.q).toBe("battery repair");
        expect(parsed.sellerId).toBe("65f0a1b2c3d4e5f607182930");
        expect(parsed.locationId).toBe("65f0a1b2c3d4e5f607182931");
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(20);
    });

    it("rejects legacy search/location moderation aliases", () => {
        expect(() => adminModerationListingsQuerySchema.parse({
            search: "battery repair",
            location: "Pune",
        })).toThrow(/search|location/i);
    });
});

describe("adminReportedAdsQuerySchema", () => {
    it("accepts canonical report filters", () => {
        const parsed = adminReportedAdsQuerySchema.parse({
            q: "counterfeit",
            status: "open",
            reason: "fraud",
            page: "3",
            limit: "10",
        });

        expect(parsed.q).toBe("counterfeit");
        expect(parsed.status).toBe("open");
        expect(parsed.reason).toBe("fraud");
        expect(parsed.page).toBe(3);
        expect(parsed.limit).toBe(10);
    });

    it("rejects the legacy search alias", () => {
        expect(() => adminReportedAdsQuerySchema.parse({
            search: "counterfeit",
        })).toThrow(/search|q/i);
    });
});
