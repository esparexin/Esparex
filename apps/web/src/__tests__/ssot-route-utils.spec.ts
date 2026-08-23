import { describe, expect, it } from "vitest";
import { isWizardPathname } from "@/lib/routeUtils";

describe("Route Utilities SSOT (FIND-019)", () => {
    it("identifies wizard routes correctly", () => {
        expect(isWizardPathname("/post-ad")).toBe(true);
        expect(isWizardPathname("/post-service")).toBe(true);
        expect(isWizardPathname("/post-spare-part-listing")).toBe(true);
        expect(isWizardPathname("/edit-ad/12345")).toBe(true);
        expect(isWizardPathname("/edit-service/12345")).toBe(true);
        expect(isWizardPathname("/edit-spare-part/12345")).toBe(true);
        expect(isWizardPathname("/account/business/apply")).toBe(true);
    });

    it("identifies non-wizard routes correctly", () => {
        expect(isWizardPathname("/")).toBe(false);
        expect(isWizardPathname("/search")).toBe(false);
        expect(isWizardPathname("/account/ads")).toBe(false);
        expect(isWizardPathname("/contact")).toBe(false);
        expect(isWizardPathname(null)).toBe(false);
        expect(isWizardPathname(undefined)).toBe(false);
    });
});
