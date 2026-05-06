import { describe, expect, it } from "vitest";

import {
    resolveBusinessLocationLabel,
    resolveListingCategoryBrowseValue,
    resolveListingCategoryLabel,
    resolveListingLocationLabel,
    resolveListingTypeBadge,
    resolveListingTypeValue,
    resolveReadableListingReferenceLabel,
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

    it("resolves brief and full location labels from normalized listings", () => {
        const location = {
            city: "Bengaluru",
            state: "Karnataka",
            display: "Koramangala, Bengaluru",
        };

        expect(resolveListingLocationLabel(location, "brief")).toBe("Bengaluru");
        expect(resolveListingLocationLabel(location, "full")).toBe("Koramangala, Bengaluru");
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
