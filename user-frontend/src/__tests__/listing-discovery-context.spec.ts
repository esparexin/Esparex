import { describe, expect, it } from "vitest";

import {
    buildRelatedBusinessesDiscoveryContext,
    normalizeRelatedBusinessesDiscoveryContext,
} from "@/lib/listings/listingDiscoveryContext";

const CATEGORY_ID = "507f1f77bcf86cd799439011";
const BRAND_ID = "507f1f77bcf86cd799439012";
const BUSINESS_ID = "507f1f77bcf86cd799439013";
const LOCATION_ID = "507f1f77bcf86cd799439014";

describe("listingDiscoveryContext", () => {
    it("builds related-business discovery context from normalized listing data", () => {
        expect(
            buildRelatedBusinessesDiscoveryContext({
                location: {
                    city: "Bengaluru",
                    locationId: LOCATION_ID,
                    coordinates: {
                        type: "Point",
                        coordinates: [77.5946, 12.9716],
                    },
                },
                category: { id: CATEGORY_ID, name: "Phones" },
                brand: { _id: BRAND_ID, name: "Samsung" },
                businessId: { id: BUSINESS_ID },
                listingType: "ad",
            })
        ).toEqual({
            city: "Bengaluru",
            locationId: LOCATION_ID,
            listingCategoryId: CATEGORY_ID,
            brandId: BRAND_ID,
            excludeBusinessId: BUSINESS_ID,
            listingType: "ad",
            latitude: 12.9716,
            longitude: 77.5946,
        });
    });

    it("normalizes query context and computes search eligibility", () => {
        const normalized = normalizeRelatedBusinessesDiscoveryContext({
            city: "Bengaluru",
            locationId: LOCATION_ID,
            listingCategoryId: CATEGORY_ID,
            brandId: BRAND_ID,
            excludeBusinessId: BUSINESS_ID,
            listingType: "service",
            latitude: 12.9716,
            longitude: 77.5946,
        });

        expect(normalized.canSearch).toBe(true);
        expect(normalized.hasGeoPoint).toBe(true);
        expect(normalized.queryParams).toEqual({
            locationId: LOCATION_ID,
            listingCategoryId: CATEGORY_ID,
            brandId: BRAND_ID,
            excludeBusinessId: BUSINESS_ID,
            latitude: 12.9716,
            longitude: 77.5946,
            radiusKm: 35,
            limit: 12,
            serviceOnly: true,
        });
    });

    it("disables related-business search when no usable discovery input exists", () => {
        const normalized = normalizeRelatedBusinessesDiscoveryContext({
            city: "   ",
            locationId: "invalid",
            latitude: Number.NaN,
            longitude: undefined,
        });

        expect(normalized.canSearch).toBe(false);
        expect(normalized.hasGeoPoint).toBe(false);
        expect(normalized.queryParams.radiusKm).toBeUndefined();
    });
});
