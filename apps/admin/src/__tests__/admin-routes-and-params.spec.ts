import { describe, it, expect } from "vitest";
import {
    mergeAdminSearchParams,
    buildAdminRouteWithMergedQuery,
    readStringParam,
    readPositiveIntParam,
    adminListingModerationRoute,
    ADMIN_UI_ROUTES,
} from "../lib/adminUiRoutes";

describe("Admin UI Routes — readStringParam", () => {
    it("returns trimmed string for valid input", () => {
        expect(readStringParam("hello")).toBe("hello");
        expect(readStringParam("  padded  ")).toBe("padded");
    });

    it("returns fallback for null/undefined/empty", () => {
        expect(readStringParam(null)).toBe("");
        expect(readStringParam(undefined)).toBe("");
        expect(readStringParam("")).toBe("");
        expect(readStringParam("   ")).toBe("");
    });

    it("uses custom fallback", () => {
        expect(readStringParam(null, "default")).toBe("default");
    });
});

describe("Admin UI Routes — readPositiveIntParam", () => {
    it("parses valid positive integers", () => {
        expect(readPositiveIntParam("5", 1)).toBe(5);
        expect(readPositiveIntParam("100", 1)).toBe(100);
    });

    it("returns fallback for non-numeric strings", () => {
        expect(readPositiveIntParam("abc", 1)).toBe(1);
        expect(readPositiveIntParam("", 1)).toBe(1);
        expect(readPositiveIntParam(null, 1)).toBe(1);
        expect(readPositiveIntParam(undefined, 1)).toBe(1);
    });

    it("returns fallback for values below minimum", () => {
        expect(readPositiveIntParam("0", 1)).toBe(1);
        expect(readPositiveIntParam("-5", 1)).toBe(1);
    });

    it("truncates floating point values", () => {
        expect(readPositiveIntParam("5.9", 1)).toBe(5);
    });

    it("supports custom minimum", () => {
        expect(readPositiveIntParam("3", 10, 5)).toBe(10);
        expect(readPositiveIntParam("5", 10, 5)).toBe(5);
        expect(readPositiveIntParam("2", 10, 5)).toBe(10);
    });

    it("rejects NaN and Infinity", () => {
        expect(readPositiveIntParam("NaN", 1)).toBe(1);
        expect(readPositiveIntParam("Infinity", 1)).toBe(1);
    });
});

describe("Admin UI Routes — mergeAdminSearchParams", () => {
    it("adds new params to empty search", () => {
        const result = mergeAdminSearchParams({ toString: () => "" }, { status: "pending" });
        expect(result.get("status")).toBe("pending");
    });

    it("overrides existing params", () => {
        const result = mergeAdminSearchParams({ toString: () => "status=live" }, { status: "pending" });
        expect(result.get("status")).toBe("pending");
    });

    it("removes params set to null/undefined", () => {
        const result = mergeAdminSearchParams({ toString: () => "status=live&page=2" }, { status: null });
        expect(result.has("status")).toBe(false);
        expect(result.get("page")).toBe("2");
    });

    it("trims string values and removes empty strings", () => {
        const result = mergeAdminSearchParams({ toString: () => "" }, { q: "   " });
        expect(result.has("q")).toBe(false);
    });
});

describe("Admin UI Routes — buildAdminRouteWithMergedQuery", () => {
    it("builds route with merged query params", () => {
        const route = buildAdminRouteWithMergedQuery("/ads", { toString: () => "page=1" }, { status: "pending" });
        expect(route).toContain("/ads?");
        expect(route).toContain("page=1");
        expect(route).toContain("status=pending");
    });

    it("returns clean path when no query params remain", () => {
        const route = buildAdminRouteWithMergedQuery("/ads", { toString: () => "status=live" }, { status: null });
        expect(route).toBe("/ads");
    });
});

describe("Admin UI Routes — adminListingModerationRoute", () => {
    it("returns correct path for each listing type", () => {
        expect(adminListingModerationRoute("ad")).toBe("/ads");
        expect(adminListingModerationRoute("service")).toBe("/services");
        expect(adminListingModerationRoute("spare_part")).toBe("/spare-parts");
    });

    it("appends query params when provided", () => {
        const route = adminListingModerationRoute("ad", { status: "pending", page: 1 });
        expect(route).toContain("/ads?");
        expect(route).toContain("status=pending");
    });
});

describe("Admin UI Routes — ADMIN_UI_ROUTES registry", () => {
    it("generates correct route for dashboard", () => {
        expect(ADMIN_UI_ROUTES.dashboard()).toBe("/dashboard");
    });

    it("generates login route with next param", () => {
        const loginRoute = ADMIN_UI_ROUTES.login("/ads");
        expect(loginRoute).toContain("/login");
        expect(loginRoute).toContain("next=");
    });

    it("generates login route without next param", () => {
        expect(ADMIN_UI_ROUTES.login()).toBe("/login");
    });

    it("generates user detail route with encoded ID", () => {
        expect(ADMIN_UI_ROUTES.userById("abc123")).toBe("/users/abc123");
    });

    it("generates all primary routes without throwing", () => {
        expect(() => ADMIN_UI_ROUTES.ads()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.services()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.spareParts()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.reports()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.users()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.businesses()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.finance()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.chat()).not.toThrow();
        expect(() => ADMIN_UI_ROUTES.catalogRequests()).not.toThrow();
    });
});
