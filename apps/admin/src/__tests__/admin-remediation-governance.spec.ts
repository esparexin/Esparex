import fs from "node:fs";
import path from "node:path";
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
    it("contains permanent server-side redirects for all consolidated route stubs", () => {
        const configPath = path.resolve(__dirname, "../../next.config.mjs");
        const configContent = fs.readFileSync(configPath, "utf8");

        expect(configContent).toContain("source: '/business-requests'");
        expect(configContent).toContain("destination: '/businesses?status=pending'");

        expect(configContent).toContain("source: '/locations/geofences'");
        expect(configContent).toContain("destination: '/locations'");

        expect(configContent).toContain("source: '/screen-sizes'");
        expect(configContent).toContain("destination: '/categories?tab=screen-sizes'");

        expect(configContent).toContain("source: '/service-types'");
        expect(configContent).toContain("destination: '/categories?tab=service-types'");

        expect(configContent).toContain("source: '/brands'");
        expect(configContent).toContain("destination: '/categories?tab=brands'");

        expect(configContent).toContain("source: '/models'");
        expect(configContent).toContain("destination: '/categories?tab=models'");

        expect(configContent).toContain("source: '/catalog-requests'");
        expect(configContent).toContain("destination: '/categories?tab=catalog-requests'");

        expect(configContent).toContain("source: '/spare-parts-catalog'");
        expect(configContent).toContain("destination: '/categories?tab=spare-parts'");
    });

    it("marks all consolidated aliases as permanent redirects", () => {
        const configPath = path.resolve(__dirname, "../../next.config.mjs");
        const configContent = fs.readFileSync(configPath, "utf8");
        expect(configContent).toContain("permanent: true");
    });
});

describe("Admin Currency Formatter SSOT", () => {
    it("formats Indian Rupee prices deterministically via formatPrice", () => {
        expect(formatPrice(0)).toBe("₹0");
        expect(formatPrice(499)).toBe("₹499");
        expect(formatPrice(25000)).toBe("₹25,000");
    });
});
