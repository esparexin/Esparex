import { describe, it, expect } from "vitest";
import {
    ADMIN_NAV_MODULES,
    getAdminModuleByPath,
    type AdminModuleKey,
} from "../components/layout/adminNavigation";
import {
    administrationTabs,
    locationsTabs,
    financeTabs,
    catalogManagementTabs,
    moderationTabs,
    serviceLifecycleTabs,
    partLifecycleTabs,
    adLifecycleTabs,
    notificationsTabs,
} from "../components/layout/adminModuleTabSets";
import {
    ADMIN_UI_ROUTES,
    adminListingModerationRoute,
    buildAdminRouteWithMergedQuery,
    readPositiveIntParam,
    readStringParam,
} from "../lib/adminUiRoutes";

describe("Admin Navigation & Route Integrity SSOT", () => {
    it("should export all expected primary navigation modules with valid hrefs and roles", () => {
        expect(ADMIN_NAV_MODULES.length).toBeGreaterThan(10);

        const keys = new Set<AdminModuleKey>();
        for (const moduleItem of ADMIN_NAV_MODULES) {
            expect(moduleItem.key).toBeDefined();
            expect(moduleItem.label).toBeTruthy();
            expect(moduleItem.icon).toBeDefined();
            expect(moduleItem.href).toMatch(/^\/[a-zA-Z0-9_\-/?=]+$/);
            expect(moduleItem.roles.length).toBeGreaterThan(0);
            keys.add(moduleItem.key);
        }

        expect(keys.has("dashboard")).toBe(true);
        expect(keys.has("ads")).toBe(true);
        expect(keys.has("businessMaster")).toBe(true);
        expect(keys.has("reports")).toBe(true);
        expect(keys.has("masterData")).toBe(true);
        expect(keys.has("locations")).toBe(true);
        expect(keys.has("users")).toBe(true);
        expect(keys.has("notifications")).toBe(true);
        expect(keys.has("chatModeration")).toBe(true);
        expect(keys.has("analytics")).toBe(true);
        expect(keys.has("googleAds")).toBe(true);
        expect(keys.has("administration")).toBe(true);
        expect(keys.has("settings")).toBe(true);
        expect(keys.has("aiConfig")).toBe(true);
    });

    it("should resolve active admin modules by pathname and aliases via getAdminModuleByPath", () => {
        expect(getAdminModuleByPath("/dashboard")?.key).toBe("dashboard");
        expect(getAdminModuleByPath("/ads")?.key).toBe("ads");
        expect(getAdminModuleByPath("/services")?.key).toBe("ads");
        expect(getAdminModuleByPath("/spare-parts")?.key).toBe("ads");
        expect(getAdminModuleByPath("/businesses")?.key).toBe("businessMaster");
        expect(getAdminModuleByPath("/categories")?.key).toBe("masterData");
        expect(getAdminModuleByPath("/brands")?.key).toBe("masterData");
        expect(getAdminModuleByPath("/locations")?.key).toBe("locations");
        expect(getAdminModuleByPath("/users")?.key).toBe("users");
        expect(getAdminModuleByPath("/plans")?.key).toBe("analytics");
        expect(getAdminModuleByPath("/invoices")?.key).toBe("analytics");
        expect(getAdminModuleByPath("/admin-users")?.key).toBe("administration");
        expect(getAdminModuleByPath("/settings")?.key).toBe("settings");
        expect(getAdminModuleByPath("/ai-config")?.key).toBe("aiConfig");
    });

    it("should maintain valid tab route structures across all module tab sets", () => {
        const tabSets = [
            administrationTabs,
            locationsTabs,
            financeTabs,
            catalogManagementTabs,
            moderationTabs,
            serviceLifecycleTabs,
            partLifecycleTabs,
            adLifecycleTabs,
            notificationsTabs,
        ];

        for (const tabSet of tabSets) {
            expect(tabSet.length).toBeGreaterThan(0);
            for (const tab of tabSet) {
                expect(tab.label).toBeTruthy();
                expect(tab.href.startsWith("/")).toBe(true);
            }
        }
    });

    it("should generate canonical route query strings with ADMIN_UI_ROUTES and route helpers", () => {
        expect(ADMIN_UI_ROUTES.dashboard()).toBe("/dashboard");
        expect(ADMIN_UI_ROUTES.ads({ status: "pending" })).toBe("/ads?status=pending");
        expect(ADMIN_UI_ROUTES.services({ status: "live" })).toBe("/services?status=live");
        expect(ADMIN_UI_ROUTES.spareParts({ status: "sold" })).toBe("/spare-parts?status=sold");
        expect(ADMIN_UI_ROUTES.userById("usr_123")).toBe("/users/usr_123");
        expect(ADMIN_UI_ROUTES.login("/dashboard")).toBe("/login?next=%2Fdashboard");

        expect(adminListingModerationRoute("ad", { status: "pending" })).toBe("/ads?status=pending");
        expect(adminListingModerationRoute("service")).toBe("/services");
        expect(adminListingModerationRoute("spare_part", { page: 2 })).toBe("/spare-parts?page=2");
    });

    it("should safely parse and sanitize query params with readStringParam and readPositiveIntParam", () => {
        expect(readStringParam("  electronics  ", "fallback")).toBe("electronics");
        expect(readStringParam("", "fallback")).toBe("fallback");
        expect(readStringParam(undefined, "fallback")).toBe("fallback");
        expect(readStringParam(null, "fallback")).toBe("fallback");

        expect(readPositiveIntParam("5", 1)).toBe(5);
        expect(readPositiveIntParam("0", 1)).toBe(1);
        expect(readPositiveIntParam("-4", 1)).toBe(1);
        expect(readPositiveIntParam("invalid", 1)).toBe(1);
        expect(readPositiveIntParam(null, 1)).toBe(1);
    });

    it("should merge search parameters correctly via buildAdminRouteWithMergedQuery", () => {
        const current = new URLSearchParams("status=pending&page=1");
        const nextUrl = buildAdminRouteWithMergedQuery("/ads", current, {
            q: "iPhone",
            page: 2,
        });

        expect(nextUrl).toBe("/ads?status=pending&page=2&q=iPhone");
    });
});
