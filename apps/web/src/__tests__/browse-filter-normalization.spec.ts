import { describe, expect, it } from "vitest";
import {
    buildBrowseBrandOptions,
    parseBrowseTokenList,
    resolveBrowseBrandLabels,
    resolveBrowseBrandSelection,
    resolveBrowseCategorySelection,
    serializeBrowseTokenList,
} from "@/lib/browse/browseFilterNormalization";

const CATEGORY_ID = "507f1f77bcf86cd799439011";
const BRAND_ID = "507f1f77bcf86cd799439012";
const SECOND_BRAND_ID = "507f1f77bcf86cd799439013";

describe("browseFilterNormalization", () => {
    it("normalizes browse token lists", () => {
        expect(parseBrowseTokenList(" apple, samsung ,apple ")).toEqual(["apple", "samsung"]);
        expect(serializeBrowseTokenList([" apple ", "apple", "samsung"])).toBe("apple,samsung");
    });

    it("resolves category tokens to canonical ids when categories are available", () => {
        expect(resolveBrowseCategorySelection("phones", [
            { id: CATEGORY_ID, name: "Phones", slug: "phones" } as Parameters<typeof resolveBrowseCategorySelection>[1][0],
        ])).toEqual({
            categoryId: CATEGORY_ID,
            category: undefined,
            label: "Phones",
        });

        expect(resolveBrowseCategorySelection(CATEGORY_ID)).toEqual({
            categoryId: CATEGORY_ID,
            category: undefined,
            label: null,
        });

        expect(resolveBrowseCategorySelection("repair-tools")).toEqual({
            categoryId: undefined,
            category: "repair-tools",
            label: "repair-tools",
        });
    });

    it("builds brand options and resolves mixed brand tokens to canonical ids", () => {
        const options = buildBrowseBrandOptions([
            { brand: "Apple", brandId: BRAND_ID },
            { brand: "Samsung", brandId: SECOND_BRAND_ID },
            { brand: "Apple", brandId: BRAND_ID },
        ]);

        expect(options).toEqual([
            { value: BRAND_ID, label: "Apple" },
            { value: SECOND_BRAND_ID, label: "Samsung" },
        ]);

        expect(
            resolveBrowseBrandSelection(["Apple", SECOND_BRAND_ID], options)
        ).toEqual([BRAND_ID, SECOND_BRAND_ID]);

        expect(
            resolveBrowseBrandLabels([BRAND_ID, "Samsung"], options)
        ).toEqual(["Apple", "Samsung"]);
    });
});
