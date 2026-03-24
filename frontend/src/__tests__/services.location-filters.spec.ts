import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServicesPage } from "@/lib/api/user/services";
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

    it("serializes locationId + level + radiusKm into the request query", async () => {
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
});
