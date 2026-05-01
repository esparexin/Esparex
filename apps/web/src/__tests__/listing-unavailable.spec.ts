import { describe, expect, it } from "vitest";

import { APIError } from "@/lib/api/APIError";
import { buildOwnerMissingListingRoute, isListingUnavailableError } from "@/lib/listings/listingUnavailable";

describe("listing unavailable helpers", () => {
    it("detects 404 listing errors across API error shapes", () => {
        expect(
            isListingUnavailableError(
                new APIError({
                    status: 404,
                    message: "Listing not found",
                    source: "backend",
                })
            )
        ).toBe(true);

        expect(
            isListingUnavailableError({
                context: { statusCode: 404 },
                message: "Service not found or unauthorized",
            })
        ).toBe(true);
    });

    it("builds owner redirects to the canonical account section and status", () => {
        expect(
            buildOwnerMissingListingRoute({
                listingType: "service",
                status: "pending",
            })
        ).toBe("/account/services?status=pending");

        expect(
            buildOwnerMissingListingRoute({
                listingType: "spare_part",
                status: "expired",
            })
        ).toBe("/account/spare-parts?status=expired");
    });
});
