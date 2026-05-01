import { describe, expect, it } from "vitest";

import {
    buildAccountListingRoute,
    normalizeAccountListingStatus,
} from "@/lib/accountListingRoutes";

describe("account listing routes", () => {
    it("builds canonical ads routes with explicit status params", () => {
        expect(buildAccountListingRoute("ads", "pending")).toBe("/account/ads?status=pending");
        expect(buildAccountListingRoute("ads")).toBe("/account/ads?status=live");
    });

    it("normalizes invalid service statuses back to live", () => {
        expect(normalizeAccountListingStatus("services", "sold")).toBe("live");
        expect(buildAccountListingRoute("services", "sold")).toBe("/account/services?status=live");
    });

    it("preserves supported spare-part statuses", () => {
        expect(normalizeAccountListingStatus("spare-parts", "expired")).toBe("expired");
        expect(buildAccountListingRoute("spare-parts", "expired")).toBe("/account/spare-parts?status=expired");
    });
});
