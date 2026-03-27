import { describe, expect, it } from "vitest";

import { isListingDetailRequest, shouldSuppressPopupForApiError } from "@/lib/api/client";

describe("api client popup suppression", () => {
    it("suppresses global popups for listing-detail 404s", () => {
        expect(
            shouldSuppressPopupForApiError(404, {
                method: "get",
                url: "listings/507f1f77bcf86cd799439011",
            })
        ).toBe(true);

        expect(
            shouldSuppressPopupForApiError(404, {
                method: "GET",
                url: "/api/v1/listings/iphone-15-pro-max-507f1f77bcf86cd799439011",
            })
        ).toBe(true);
    });

    it("keeps popup handling enabled for non-detail listing routes and non-404s", () => {
        expect(isListingDetailRequest("listings/mine", "get")).toBe(false);
        expect(isListingDetailRequest("listings/507f1f77bcf86cd799439011/phone", "get")).toBe(false);
        expect(isListingDetailRequest("listings/507f1f77bcf86cd799439011", "delete")).toBe(false);

        expect(
            shouldSuppressPopupForApiError(500, {
                method: "get",
                url: "listings/507f1f77bcf86cd799439011",
            })
        ).toBe(false);

        expect(
            shouldSuppressPopupForApiError(404, {
                method: "get",
                url: "listings/mine",
            })
        ).toBe(false);
    });
});
