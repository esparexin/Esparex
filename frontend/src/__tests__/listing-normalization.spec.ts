import { describe, expect, it } from "vitest";

import { normalizeListing } from "@/lib/api/user/listings";

describe("normalizeListing", () => {
    it("keeps populated catalog refs and business metadata on detail payloads", () => {
        const listing = normalizeListing({
            id: "507f1f77bcf86cd799439011",
            title: "iPhone 15 Pro Max",
            price: 1000,
            description: "Clean device",
            images: ["https://example.com/a.jpg"],
            categoryId: { _id: "507f1f77bcf86cd799439012", name: "Phones", slug: "phones" },
            brandId: { _id: "507f1f77bcf86cd799439013", name: "Apple", slug: "apple" },
            modelId: { _id: "507f1f77bcf86cd799439014", name: "15 Pro Max", slug: "15-pro-max" },
            businessId: { _id: "507f1f77bcf86cd799439015" },
            businessName: "Esparex Repairs",
            businessType: "Repair Center",
            businessCategory: "Repair Center",
            sellerType: "business",
            sellerId: { _id: "507f1f77bcf86cd799439016", name: "Esparex Repairs", isVerified: true },
            location: { city: "Bengaluru", state: "Karnataka" },
            status: "live",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            views: { total: 24, unique: 12, lastViewedAt: new Date().toISOString() },
        });

        expect(listing.categoryId).toBe("507f1f77bcf86cd799439012");
        expect(listing.brandId).toBe("507f1f77bcf86cd799439013");
        expect(listing.modelId).toBe("507f1f77bcf86cd799439014");
        expect(listing.businessId).toBe("507f1f77bcf86cd799439015");
        expect(listing.category).toBe("Phones");
        expect(listing.brand).toBe("Apple");
        expect(listing.sellerName).toBe("Esparex Repairs");
        expect(listing.businessName).toBe("Esparex Repairs");
        expect(listing.verified).toBe(true);
        expect(listing.views).toBe(24);
    });
});
