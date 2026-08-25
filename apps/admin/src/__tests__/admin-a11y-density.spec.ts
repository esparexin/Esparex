import { describe, it, expect } from "vitest";
import { getListingPresentation, getListingPriceSummary, getListingAttribute } from "../components/moderation/listingPresentation";
import type { ModerationItem } from "../components/moderation/moderationTypes";

describe("Admin Moderation Presentation & Table Density SSOT", () => {
    it("should provide consistent table headers and labels per listing type", () => {
        const adPres = getListingPresentation("ad");
        expect(adPres.actionEntityLabel).toBe("listing");
        expect(adPres.actionEntityLabelPlural).toBe("listings");
        expect(adPres.tableDetailsHeader).toBe("Ad Details");
        expect(adPres.attributeHeader).toBe("Condition");

        const servicePres = getListingPresentation("service");
        expect(servicePres.actionEntityLabel).toBe("service");
        expect(servicePres.actionEntityLabelPlural).toBe("services");
        expect(servicePres.tableDetailsHeader).toBe("Service Details");
        expect(servicePres.attributeHeader).toBe("Service Mode");

        const partPres = getListingPresentation("spare_part");
        expect(partPres.actionEntityLabel).toBe("spare part listing");
        expect(partPres.actionEntityLabelPlural).toBe("spare part listings");
        expect(partPres.tableDetailsHeader).toBe("Part Details");
        expect(partPres.attributeHeader).toBe("Part Condition");
    });

    it("should format listing price summary correctly for ads and services", () => {
        const adItem: ModerationItem = {
            id: "ad_123",
            title: "iPhone 13 Pro 128GB",
            price: 45000,
            currency: "₹",
            status: "pending",
            createdAt: "2026-08-20T10:00:00.000Z",
            images: [],
            sellerId: "usr_1",
            sellerName: "John Doe",
            reportCount: 0,
            fraudScore: 0,
        };

        expect(getListingPriceSummary(adItem)).toBe("₹ 45,000");

        const serviceItem: ModerationItem = {
            id: "svc_123",
            listingType: "service",
            title: "Screen Replacement Service",
            price: 0,
            priceMin: 1500,
            priceMax: 3500,
            currency: "₹",
            status: "pending",
            createdAt: "2026-08-20T10:00:00.000Z",
            images: [],
            sellerId: "usr_2",
            sellerName: "Tech Repairs",
            reportCount: 0,
            fraudScore: 0,
        };

        expect(getListingPriceSummary(serviceItem)).toBe("₹ 1,500 - ₹ 3,500");
    });

    it("should resolve listing attribute labels appropriately", () => {
        const adItem: ModerationItem = {
            id: "ad_456",
            title: "MacBook Air M2",
            price: 85000,
            currency: "₹",
            condition: "used",
            status: "pending",
            createdAt: "2026-08-20T10:00:00.000Z",
            images: [],
            reportCount: 0,
            fraudScore: 0,
        };

        const attr = getListingAttribute(adItem, "ad");
        expect(attr.label).toBe("Condition");
        expect(attr.value).toBe("Used");
    });
});
