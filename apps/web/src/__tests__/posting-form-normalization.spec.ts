import { describe, expect, it } from "vitest";
import {
    buildGenericListingEditResetValues,
    buildPostAdEditPayload,
    buildPostAdIdentityPatch,
    buildServiceListingEditValues,
    buildSparePartListingEditValues,
    resolveCatalogEntityId,
    resolveServiceTypeSelectionIds,
} from "@/lib/listings/postingFormNormalization";

const CATEGORY_ID = "507f1f77bcf86cd799439011";
const BRAND_ID = "507f1f77bcf86cd799439012";
const MODEL_ID = "507f1f77bcf86cd799439013";
const SERVICE_TYPE_ID = "507f1f77bcf86cd799439014";
const SECOND_SERVICE_TYPE_ID = "507f1f77bcf86cd799439015";
const SPARE_PART_ID = "507f1f77bcf86cd799439016";

describe("postingFormNormalization", () => {
    it("prefers strict catalog ids over display labels", () => {
        expect(resolveCatalogEntityId("Phones", { _id: CATEGORY_ID })).toBe(CATEGORY_ID);
        expect(resolveCatalogEntityId({ id: BRAND_ID }, "Apple")).toBe(BRAND_ID);
        expect(resolveCatalogEntityId("not-an-id")).toBe("");
    });

    it("keeps generic edit resets on canonical ids", () => {
        const values = buildGenericListingEditResetValues({
            title: "Service listing",
            category: "Phones",
            categoryId: { _id: CATEGORY_ID },
            brand: "Apple",
            brandId: { id: BRAND_ID },
        });

        expect(values.categoryId).toBe(CATEGORY_ID);
        expect(values.brandId).toBe(BRAND_ID);
    });

    it("normalizes service edit payloads from canonical serviceTypeIds", () => {
        const values = buildServiceListingEditValues({
            title: "iPhone repair",
            category: "Phones",
            categoryId: { _id: CATEGORY_ID },
            brand: "Apple",
            brandId: { _id: BRAND_ID },
            serviceTypeIds: ["Screen Replacement", { id: SECOND_SERVICE_TYPE_ID }],
            priceMin: 499,
            description: "Original parts",
        });

        expect(values).toEqual({
            title: "iPhone repair",
            categoryId: CATEGORY_ID,
            brandId: BRAND_ID,
            serviceTypeIds: ["Screen Replacement", SECOND_SERVICE_TYPE_ID],
            price: 499,
            description: "Original parts",
        });

        const resolvedIds = resolveServiceTypeSelectionIds(values.serviceTypeIds ?? [], [
            { id: SERVICE_TYPE_ID, name: "Screen Replacement" },
            { id: SECOND_SERVICE_TYPE_ID, name: "Battery Replacement" },
        ]);

        expect(resolvedIds).toEqual([SERVICE_TYPE_ID, SECOND_SERVICE_TYPE_ID]);
    });

    it("does not hydrate service edit values from the removed serviceTypes alias", () => {
        const values = buildServiceListingEditValues({
            title: "iPhone repair",
            categoryId: { _id: CATEGORY_ID },
            brandId: { _id: BRAND_ID },
            serviceTypes: ["Screen Replacement"],
            priceMin: 499,
            description: "Original parts",
        });

        expect(values.serviceTypeIds).toEqual([]);
    });

    it("normalizes spare-part edit payloads onto canonical ids", () => {
        const values = buildSparePartListingEditValues({
            title: "OEM display",
            categoryId: { _id: CATEGORY_ID },
            brand: "Samsung",
            brandId: { id: BRAND_ID },
            sparePartId: { _id: SPARE_PART_ID },
            price: 1200,
            description: "Pulled from working device",
        });

        expect(values).toEqual({
            title: "OEM display",
            categoryId: CATEGORY_ID,
            brandId: BRAND_ID,
            sparePartTypeId: SPARE_PART_ID,
            price: 1200,
            description: "Pulled from working device",
        });
    });

    it("builds canonical ad identity patches and strips invalid spare-part ids", () => {
        const values = buildPostAdIdentityPatch({
            category: "Phones",
            categoryId: { _id: CATEGORY_ID } as never,
            brandId: { id: BRAND_ID } as never,
            modelId: MODEL_ID,
            spareParts: [SPARE_PART_ID, "invalid", { _id: SPARE_PART_ID }] as never,
        });

        expect(values).toEqual({
            categoryId: CATEGORY_ID,
            category: CATEGORY_ID,
            brandId: BRAND_ID,
            modelId: MODEL_ID,
            spareParts: [SPARE_PART_ID],
        });
    });

    it("keeps edit payload location immutable when locked", () => {
        const payload = {
            title: "iPhone 15",
            description: "Clean device",
            price: 1000,
            images: ["https://example.com/a.jpg"],
            isFree: false,
            location: {
                city: "Bengaluru",
                state: "Karnataka",
                locationId: CATEGORY_ID,
            },
        } as Record<string, unknown>;

        expect(buildPostAdEditPayload(payload, true)).not.toHaveProperty("location");
        expect(buildPostAdEditPayload(payload, false)).toHaveProperty("location");
    });
});
