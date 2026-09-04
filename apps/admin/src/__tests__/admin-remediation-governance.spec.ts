import { describe, it, expect } from "vitest";
import { validateRequiredCategoryIds } from "../components/catalog/catalogDomainUtils";
import { ADMIN_UI_ROUTES } from "../lib/adminUiRoutes";
import { formatPrice } from "@esparex/shared";

describe("Admin Category Validation Governance — validateRequiredCategoryIds", () => {
    it("returns error string when categoryIds is undefined or null", () => {
        expect(validateRequiredCategoryIds(undefined)).toBe("Please select at least one category");
        expect(validateRequiredCategoryIds(null)).toBe("Please select at least one category");
    });

    it("returns error string when categoryIds array is empty", () => {
        expect(validateRequiredCategoryIds([])).toBe("Please select at least one category");
    });

    it("returns error string when categoryIds contains only empty strings or falsy values", () => {
        expect(validateRequiredCategoryIds(["", "   "])).toBe("Please select at least one category");
    });

    it("returns null when categoryIds contains valid non-empty category IDs", () => {
        expect(validateRequiredCategoryIds(["cat_smartphones"])).toBeNull();
        expect(validateRequiredCategoryIds(["cat_1", "cat_2"])).toBeNull();
    });
});

describe("Admin Route Registry Governance — Canonical Destinations", () => {
    it("generates canonical /categories?tab=catalog-requests for catalogRequests route helper", () => {
        expect(ADMIN_UI_ROUTES.catalogRequests()).toBe("/categories?tab=catalog-requests");
    });

    it("preserves additional query params when routing to catalogRequests", () => {
        const route = ADMIN_UI_ROUTES.catalogRequests({ status: "pending", page: 2 });
        expect(route).toContain("/categories?");
        expect(route).toContain("tab=catalog-requests");
        expect(route).toContain("status=pending");
        expect(route).toContain("page=2");
    });
});

describe("Admin Route Redirect Invariants — next.config.mjs", () => {
    it("contains permanent server-side redirects for all consolidated route stubs", async () => {
        const nextConfigModule = await import("../../next.config.mjs");
        const config = nextConfigModule.default as { redirects: () => Promise<Array<{ source: string; destination: string; permanent?: boolean }>> };
        const redirects = await config.redirects();
        const redirectMap = new Map(redirects.map((r) => [r.source, r.destination]));

        expect(redirectMap.get("/business-requests")).toBe("/businesses?status=pending");
        expect(redirectMap.get("/locations/geofences")).toBe("/locations");
        expect(redirectMap.get("/screen-sizes")).toBe("/categories?tab=screen-sizes");
        expect(redirectMap.get("/service-types")).toBe("/categories?tab=service-types");
        expect(redirectMap.get("/brands")).toBe("/categories?tab=brands");
        expect(redirectMap.get("/models")).toBe("/categories?tab=models");
        expect(redirectMap.get("/catalog-requests")).toBe("/categories?tab=catalog-requests");
        expect(redirectMap.get("/spare-parts-catalog")).toBe("/categories?tab=spare-parts");
    });

    it("marks all consolidated aliases as permanent 308 redirects", async () => {
        const nextConfigModule = await import("../../next.config.mjs");
        const config = nextConfigModule.default as { redirects: () => Promise<Array<{ source: string; destination: string; permanent?: boolean }>> };
        const redirects = await config.redirects();
        for (const r of redirects) {
            expect(r.permanent).toBe(true);
        }
    });
});

describe("Admin Currency Formatter SSOT", () => {
    it("formats Indian Rupee prices deterministically via formatPrice", () => {
        expect(formatPrice(0)).toBe("₹0");
        expect(formatPrice(499)).toBe("₹499");
        expect(formatPrice(25000)).toBe("₹25,000");
    });
});
