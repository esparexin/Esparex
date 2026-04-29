import { describe, expect, it } from "vitest";

import { normalizeListing, normalizeListingContactNumberResponse } from "@/lib/api/user/listings/normalizer";

describe("normalizeListing", () => {
    it("keeps canonical hydrated catalog names and business metadata on detail payloads", () => {
        const listing = normalizeListing({
            id: "507f1f77bcf86cd799439011",
            title: "iPhone 15 Pro Max",
            price: 1000,
            description: "Clean device",
            images: ["https://example.com/a.jpg"],
            categoryId: { _id: "507f1f77bcf86cd799439012", name: "Phones", slug: "phones" },
            brandId: { _id: "507f1f77bcf86cd799439013", name: "Apple", slug: "apple" },
            modelId: { _id: "507f1f77bcf86cd799439014", name: "15 Pro Max", slug: "15-pro-max" },
            categoryName: "Phones",
            brandName: "Apple",
            modelName: "15 Pro Max",
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
        expect((listing as { category?: unknown }).category).toBeUndefined();
        expect((listing as { brand?: unknown }).brand).toBeUndefined();
        expect(listing.categoryName).toBe("Phones");
        expect(listing.brandName).toBe("Apple");
        expect(listing.modelName).toBe("15 Pro Max");
        expect(listing.sellerName).toBe("Esparex Repairs");
        expect(listing.businessName).toBe("Esparex Repairs");
        expect(listing.verified).toBe(true);
        expect(listing.views).toEqual({
            total: 24,
            unique: 12,
            lastViewedAt: expect.any(String),
        });
        expect((listing as { userId?: unknown }).userId).toBeUndefined();
    });

    it("preserves explicit sellerName from detail payloads for individual sellers", () => {
        const listing = normalizeListing({
            id: "507f1f77bcf86cd799439011",
            title: "Pixel 9",
            price: 700,
            description: "Well maintained device",
            images: ["https://example.com/a.jpg"],
            sellerType: "user",
            sellerName: "Rakesh Kumar",
            sellerId: { _id: "507f1f77bcf86cd799439016", name: "Rakesh Kumar", isVerified: true },
            location: { city: "Bengaluru", state: "Karnataka" },
            status: "live",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        expect(listing.sellerName).toBe("Rakesh Kumar");
        expect(listing.isBusiness).toBe(false);
        expect(listing.verified).toBe(true);
        expect((listing as { userId?: unknown }).userId).toBeUndefined();
    });

    it("ignores removed legacy owner and populated label aliases", () => {
        const listing = normalizeListing({
            id: "507f1f77bcf86cd799439011",
            title: "Legacy payload",
            price: 100,
            description: "Legacy payload description",
            images: ["https://example.com/a.jpg"],
            userId: "507f1f77bcf86cd799439016",
            seller: { name: "Legacy Seller", isVerified: true },
            category: { _id: "507f1f77bcf86cd799439012", name: "Phones" },
            brand: { _id: "507f1f77bcf86cd799439013", name: "Apple" },
            model: { _id: "507f1f77bcf86cd799439014", name: "15 Pro Max" },
            location: { city: "Bengaluru", state: "Karnataka" },
            status: "live",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        expect(listing.sellerId).toBe("");
        expect(listing.sellerName).toBe("Esparex Seller");
        expect(listing.verified).toBe(false);
        expect((listing as { category?: unknown }).category).toBeUndefined();
        expect((listing as { brand?: unknown }).brand).toBeUndefined();
        expect((listing as { model?: unknown }).model).toBeUndefined();
    });
});

describe("normalizeListingContactNumberResponse", () => {
    it("normalizes legacy phone fallback into canonical mobile", () => {
        expect(
            normalizeListingContactNumberResponse({
                phone: "+919999888877",
            })
        ).toEqual({
            mobile: "+919999888877",
        });
    });

    it("preserves masked-only responses for unauthenticated reveals", () => {
        expect(
            normalizeListingContactNumberResponse({
                masked: "999****8877",
            })
        ).toEqual({
            masked: "999****8877",
        });
    });
});
