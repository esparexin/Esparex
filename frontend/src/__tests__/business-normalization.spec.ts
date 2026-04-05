import { describe, expect, it } from "vitest";

import { normalizeBusiness } from "@/lib/api/user/businesses";

describe("normalizeBusiness", () => {
    it("preserves structured location fields required by the business edit flow", () => {
        const business = normalizeBusiness({
            id: "507f1f77bcf86cd799439011",
            userId: "507f1f77bcf86cd799439012",
            name: "Repair Hub",
            description: "Fast and reliable repairs",
            mobile: "9876543210",
            email: "shop@example.com",
            businessTypes: ["Repair services"],
            locationId: "507f1f77bcf86cd799439013",
            location: {
                locationId: "507f1f77bcf86cd799439013",
                address: "Shop 12, Main Road, Macherla, Andhra Pradesh, 522426",
                display: "Macherla, Andhra Pradesh",
                shopNo: "Shop 12",
                street: "Main Road",
                landmark: "Near Bus Stand",
                city: "Macherla",
                state: "Andhra Pradesh",
                country: "India",
                pincode: "522426",
                coordinates: { type: "Point", coordinates: [79.44, 16.48] },
            },
            documents: [],
            status: "pending",
            trustScore: 50,
            isVerified: false,
            verified: false,
            createdAt: new Date().toISOString(),
        } as any);

        expect(business).not.toBeNull();
        expect(business?.sellerId).toBe("507f1f77bcf86cd799439012");
        expect(business?.mobile).toBe("9876543210");
        expect(business?.businessTypes[0]).toBe("Repair services");
        expect(business?.isVerified).toBe(false);
        expect(business?.location.locationId).toBe("507f1f77bcf86cd799439013");
        expect(business?.location.shopNo).toBe("Shop 12");
        expect(business?.location.street).toBe("Main Road");
        expect(business?.location.landmark).toBe("Near Bus Stand");
        expect(business?.location.address).toContain("Shop 12");
        expect(business?.location.display).toBe("Macherla, Andhra Pradesh");
        expect(business?.location.coordinates).toEqual({ type: "Point", coordinates: [79.44, 16.48] });
    });
});
