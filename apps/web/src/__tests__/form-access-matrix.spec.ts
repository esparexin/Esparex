import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Form Access Matrix Regression Suite (STRICT RULE — Listing / Posting Form Access).
 *
 * Single source of truth:
 * - Normal users: Ads + Smart Alerts forms only.
 * - Verified business users: Ads + Smart Alerts + Services + Spare Parts.
 *
 * These tests pin the existing enforcement wiring so no future change can
 * silently expose Services/Spare Parts creation to normal users through the
 * FAB, menus, routes, or backend. Behavior-preserving: asserts wiring only.
 */
describe("Form Access Matrix Regression Suite", () => {
    const webSrc = path.resolve(__dirname, "..");
    const apiSrc = path.resolve(__dirname, "../../../../backend/api/src");

    const readWeb = (rel: string) => fs.readFileSync(path.join(webSrc, rel), "utf-8");
    const readApi = (rel: string) => fs.readFileSync(path.join(apiSrc, rel), "utf-8");

    it("gates FAB service/spare actions behind business approval, alert open to authed users", () => {
        const fab = readWeb(path.join("components", "layout", "BusinessPostFAB.tsx"));

        // Guests see nothing.
        expect(fab).toContain('status !== "authenticated"');
        // Service + spare items exist only inside the approved spread.
        expect(fab).toMatch(/isApproved \? \[[\s\S]*?Post Spare Part[\s\S]*?Post Service[\s\S]*?\] : \[\]/);
        expect(fab).toContain('href: "/post-spare-part-listing"');
        expect(fab).toContain('href: "/post-service"');
        // Smart Alert is unconditional for authenticated users.
        expect(fab).toContain("Create Smart Alert");
    });

    it("encodes the matrix in the permission SSOT (ads/alerts open, service/parts business-only)", () => {
        const matrix = readWeb(path.join("permissions", "permissionMatrix.ts"));

        expect(matrix).toMatch(/postAd:\s*\{[\s\S]*?requiresBusinessApproved:\s*false/);
        expect(matrix).toMatch(/postService:\s*\{[\s\S]*?requiresBusinessApproved:\s*true/);
        expect(matrix).toMatch(/postParts:\s*\{[\s\S]*?requiresBusinessApproved:\s*true/);
    });

    it("hides service/spare tabs from normal users in My Listings", () => {
        const tab = readWeb(path.join("components", "user", "profile", "tabs", "MyListingsTab.tsx"));

        expect(tab).toMatch(/isVerifiedBusiness[\s\S]*?filter/);
    });

    it("double-guards the service and spare-part post pages (route guard + gate page)", () => {
        for (const page of ["post-service", "post-spare-part-listing"]) {
            const content = readWeb(path.join("app", "(private)", page, "page.tsx"));

            expect(content).toContain("requireBusinessAuth");
            expect(content).toContain("withGuard");
            expect(content).toContain("BusinessListingGatePage");
        }
    });

    it("double-guards the service and spare-part edit pages", () => {
        for (const page of ["edit-service", "edit-spare-part"]) {
            const content = readWeb(path.join("app", "(private)", `${page}`, "[id]", "page.tsx"));

            expect(content).toContain("requireBusinessAuth");
        }
    });

    it("keeps ad posting and smart-alert creation free of business gates", () => {
        const postAd = readWeb(path.join("app", "(private)", "post-ad", "page.tsx"));

        expect(postAd).not.toContain("requireBusinessAuth");
        expect(postAd).not.toContain("BusinessListingGatePage");

        const smartAlerts = readWeb(
            path.join("components", "user", "profile", "tabs", "SmartAlertsTab.tsx")
        );

        expect(smartAlerts).not.toMatch(/requireBusinessAuth|BusinessListingGatePage|isApprovedBusiness/);
    });

    it("enforces the matrix on the backend: listings gated, smart alerts auth-only", () => {
        const listings = readApi(path.join("routes", "listingRoutes.ts"));

        expect(listings).toMatch(/router\.post\("\/",[\s\S]*?requireVerifiedBusinessForServiceParts/);
        expect(listings).toMatch(/\/:id\/edit"[\s\S]*?requireVerifiedBusinessForServiceParts/);

        const alerts = readApi(path.join("routes", "smartAlertRoutes.ts"));

        expect(alerts).not.toContain("requireVerifiedBusiness");
        expect(alerts).not.toContain("requireBusinessApproved");
        expect(alerts).toContain("protect");
    });
});
