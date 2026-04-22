import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAdsPage as getServicesPage, getHomeAds, getTrendingAds } from "@/lib/api/user/listings";
import { getBusinesses } from "@/lib/api/user/businesses";
import { apiClient } from "@/lib/api/client";

vi.mock("@/lib/api/client", () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

describe("Services location filters regression", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("serializes locationId + level + radiusKm into the request query", async () => {
        vi.stubGlobal("window", {});
        vi.mocked(apiClient.get).mockResolvedValueOnce({
            success: true,
            data: [],
            pagination: { page: 1, limit: 20, hasMore: false },
        });

        await getServicesPage({
            locationId: "65f0a1b2c3d4e5f607182930",
            level: "city",
            radiusKm: 50,
            page: 1,
            limit: 20,
        });

        expect(apiClient.get).toHaveBeenCalledTimes(1);
        const [endpoint] = vi.mocked(apiClient.get).mock.calls[0] ?? [];
        expect(String(endpoint)).toContain("locationId=65f0a1b2c3d4e5f607182930");
        expect(String(endpoint)).toContain("level=city");
        expect(String(endpoint)).toContain("radiusKm=50");
    });

    it("does not serialize deprecated category/location aliases on listing discovery requests", async () => {
        vi.stubGlobal("window", {});
        vi.mocked(apiClient.get).mockResolvedValueOnce({
            success: true,
            data: [],
            pagination: { page: 1, limit: 20, hasMore: false },
        });

        await getServicesPage({
            categoryId: "65f0a1b2c3d4e5f607182931",
            locationId: "65f0a1b2c3d4e5f607182930",
            page: 1,
            limit: 20,
            category: "phones",
            location: "Pune",
        } as never);

        const [endpoint] = vi.mocked(apiClient.get).mock.calls[0] ?? [];
        expect(String(endpoint)).toContain("categoryId=65f0a1b2c3d4e5f607182931");
        expect(String(endpoint)).toContain("locationId=65f0a1b2c3d4e5f607182930");
        expect(String(endpoint)).not.toContain("category=phones");
        expect(String(endpoint)).not.toContain("location=Pune");
    });

    it("serializes only canonical home/trending discovery filters", async () => {
        vi.stubGlobal("window", {});
        vi.mocked(apiClient.get)
            .mockResolvedValueOnce({
                success: true,
                data: { ads: [], nextCursor: null, hasMore: false },
            })
            .mockResolvedValueOnce({
                success: true,
                data: { ads: [] },
            });

        await getHomeAds({
            limit: 12,
            locationId: "65f0a1b2c3d4e5f607182930",
            level: "city",
            radiusKm: 50,
            location: "Pune",
        } as never);
        await getTrendingAds({
            limit: 10,
            categoryId: "65f0a1b2c3d4e5f607182931",
            locationId: "65f0a1b2c3d4e5f607182930",
            category: "phones",
            location: "Pune",
        } as never);

        const [homeEndpoint] = vi.mocked(apiClient.get).mock.calls[0] ?? [];
        expect(String(homeEndpoint)).toContain("locationId=65f0a1b2c3d4e5f607182930");
        expect(String(homeEndpoint)).not.toContain("location=Pune");

        const [trendingEndpoint] = vi.mocked(apiClient.get).mock.calls[1] ?? [];
        expect(String(trendingEndpoint)).toContain("categoryId=65f0a1b2c3d4e5f607182931");
        expect(String(trendingEndpoint)).toContain("locationId=65f0a1b2c3d4e5f607182930");
        expect(String(trendingEndpoint)).not.toContain("category=phones");
        expect(String(trendingEndpoint)).not.toContain("location=Pune");
    });

    it("serializes only canonical business discovery filters", async () => {
        vi.stubGlobal("window", {});
        vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: [],
        });

        await getBusinesses({
            locationId: "65f0a1b2c3d4e5f607182930",
            listingCategoryId: "65f0a1b2c3d4e5f607182931",
            brandId: "65f0a1b2c3d4e5f607182932",
            limit: 12,
            serviceOnly: true,
            city: "Pune",
            category: "phones",
        } as never);

        const businessCalls = vi.mocked(apiClient.get).mock.calls;
        const [endpoint] = businessCalls[businessCalls.length - 1] ?? [];
        expect(String(endpoint)).toContain("locationId=65f0a1b2c3d4e5f607182930");
        expect(String(endpoint)).toContain("listingCategoryId=65f0a1b2c3d4e5f607182931");
        expect(String(endpoint)).toContain("brandId=65f0a1b2c3d4e5f607182932");
        expect(String(endpoint)).not.toContain("city=Pune");
        expect(String(endpoint)).not.toContain("category=phones");
    });
});
