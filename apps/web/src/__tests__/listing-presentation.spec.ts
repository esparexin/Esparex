import { describe, expect, it } from "vitest";

import {
    resolveBusinessLocationLabel,
    resolveListingCategoryBrowseValue,
    resolveListingCategoryLabel,
    resolveListingLocationLabel,
    resolveListingTypeBadge,
    resolveListingTypeValue,
    resolveReadableListingReferenceLabel,
    sanitizeListingTitle,
} from "@/lib/listings/listingPresentation";

const CATEGORY_ID = "507f1f77bcf86cd799439011";

describe("listingPresentation", () => {
    it("prefers readable category labels and falls back to listing type labels", () => {
        expect(
            resolveListingCategoryLabel({
                category: CATEGORY_ID,
                categoryName: "Phones",
            })
        ).toBe("Phones");

        expect(
            resolveListingCategoryLabel({
                category: CATEGORY_ID,
                listingType: "service",
            })
        ).toBe("Service");

        expect(
            resolveListingCategoryLabel({
                category: CATEGORY_ID,
                listingType: "spare_part",
            })
        ).toBe("Spare Part");
    });

    it("prefers canonical category ids for browse tokens", () => {
        expect(
            resolveListingCategoryBrowseValue({
                categoryId: CATEGORY_ID,
                category: "Phones",
            })
        ).toBe(CATEGORY_ID);

        expect(
            resolveListingCategoryBrowseValue({
                category: "phones",
            })
        ).toBe("phones");
    });

    it("resolves location labels following full geographic fallback hierarchy", () => {
        const cityAndState = {
            city: "Macherla",
            state: "Andhra Pradesh",
            country: "India",
        };
        expect(resolveListingLocationLabel(cityAndState, "brief")).toBe("Macherla");
        expect(resolveListingLocationLabel(cityAndState, "full")).toBe("Macherla, Andhra Pradesh");

        const cityOnly = { city: "Bengaluru", country: "India" };
        expect(resolveListingLocationLabel(cityOnly, "brief")).toBe("Bengaluru");

        const districtAndState = { district: "Guntur", state: "Andhra Pradesh", country: "India" };
        expect(resolveListingLocationLabel(districtAndState, "brief")).toBe("Guntur");
        expect(resolveListingLocationLabel(districtAndState, "full")).toBe("Guntur, Andhra Pradesh");

        const stateOnly = { state: "Karnataka", country: "India" };
        expect(resolveListingLocationLabel(stateOnly, "brief")).toBe("Karnataka");

        const countryOnly = { country: "India" };
        expect(resolveListingLocationLabel(countryOnly, "brief")).toBe("Location unavailable");
        expect(resolveListingLocationLabel(countryOnly, "full")).toBe("India");

        expect(resolveListingLocationLabel(null, "brief")).toBe("Location unavailable");
        expect(resolveListingLocationLabel(undefined, "brief")).toBe("Location unavailable");
    });

    it("sanitizes runtime and corrupt system strings from listing titles", () => {
        const validTitle = "Apple iPhone 13 - Powers On";
        expect(sanitizeListingTitle(validTitle)).toBe("Apple iPhone 13 - Powers On");

        const categoryContext = { categoryName: "Smartphones" };
        expect(sanitizeListingTitle("websocket.js:119 WebSocket connection to 'ws://localhost:500", categoryContext)).toBe("Smartphones");
        expect(sanitizeListingTitle("webpack error loading chunk", categoryContext)).toBe("Smartphones");
        expect(sanitizeListingTitle("https://example.com/api", categoryContext)).toBe("Smartphones");
        expect(sanitizeListingTitle("Error: Uncaught Exception", categoryContext)).toBe("Smartphones");
        expect(sanitizeListingTitle("[object Object]", categoryContext)).toBe("Smartphones");
        expect(sanitizeListingTitle(null, categoryContext)).toBe("Smartphones");
        expect(sanitizeListingTitle(undefined, categoryContext)).toBe("Smartphones");
    });

    it("extracts readable labels from object-backed catalog references", () => {
        expect(
            resolveReadableListingReferenceLabel({
                name: "Samsung",
            })
        ).toBe("Samsung");

        expect(
            resolveReadableListingReferenceLabel({
                title: "Screen Replacement",
            })
        ).toBe("Screen Replacement");
    });

    it("resolves canonical listing type badges from listingType only", () => {
        expect(
            resolveListingTypeValue({
                listingType: "spare_part",
            })
        ).toBe("spare_part");

        expect(
            resolveListingTypeBadge({
                listingType: "service",
            })
        ).toEqual({
            type: "service",
            label: "Service",
            className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        });

        expect(
            resolveListingTypeBadge({
                listingType: undefined,
                category: "spares",
            } as Parameters<typeof resolveListingTypeBadge>[0])
        ).toEqual({
            type: "ad",
            label: "Device",
            className: "bg-blue-50 text-link-dark border-blue-100",
        });
    });

    it("prefers explicit business location over listing location fallbacks", () => {
        expect(
            resolveBusinessLocationLabel({
                businessCity: "Mumbai",
                businessState: "Maharashtra",
                location: { display: "Pune, Maharashtra" },
            })
        ).toBe("Mumbai, Maharashtra");

        expect(
            resolveBusinessLocationLabel({
                location: { display: "Pune, Maharashtra" },
            })
        ).toBe("Pune, Maharashtra");
    });
});
