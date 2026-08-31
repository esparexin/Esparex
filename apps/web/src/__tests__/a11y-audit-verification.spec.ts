import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Accessibility Verification (FIND-008 & FIND-009)", () => {
    const webSrcDir = path.resolve(__dirname, "..");

    it("verifies BrowseFilterSidebar has aria-expanded and aria-controls on all 3 accordion toggles", () => {
        const filePath = path.join(webSrcDir, "components/user/BrowseFilterSidebar.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).toContain('aria-expanded={categoryExpanded}');
        expect(content).toContain('aria-controls="filter-categories-section"');
        expect(content).toContain('id="filter-categories-section"');

        expect(content).toContain('aria-expanded={priceExpanded}');
        expect(content).toContain('aria-controls="filter-price-section"');
        expect(content).toContain('id="filter-price-section"');

        expect(content).toContain('aria-expanded={conditionExpanded}');
        expect(content).toContain('aria-controls="filter-condition-section"');
        expect(content).toContain('id="filter-condition-section"');
    });

    it("verifies Header search input has aria-label and unique DOM IDs", () => {
        const filePath = path.join(webSrcDir, "components/user/Header.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).toContain('id="header-desktop-search"');
        expect(content).toContain('aria-label="Search for mobiles, parts, services"');
        expect(content).toContain('id="header-mobile-search"');
    });
});
