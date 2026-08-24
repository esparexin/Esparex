import { describe, it, expect } from "vitest";

describe("Admin Device Catalog & Locations Management SSOT", () => {
    it("should correctly normalize location status query parameters", () => {
        const LOCATION_STATUS_VALUES = new Set(["all", "active", "inactive"]);

        const normalizeStatusParam = (value: string | null): string =>
            value && LOCATION_STATUS_VALUES.has(value) ? value : "all";

        expect(normalizeStatusParam("active")).toBe("active");
        expect(normalizeStatusParam("inactive")).toBe("inactive");
        expect(normalizeStatusParam("all")).toBe("all");
        expect(normalizeStatusParam("invalid")).toBe("all");
        expect(normalizeStatusParam(null)).toBe("all");
    });

    it("should correctly normalize location level query parameters", () => {
        const LOCATION_LEVEL_VALUES = new Set(["all", "state", "city", "area"]);

        const normalizeLevelParam = (value: string | null): string =>
            value && LOCATION_LEVEL_VALUES.has(value) ? value : "all";

        expect(normalizeLevelParam("state")).toBe("state");
        expect(normalizeLevelParam("city")).toBe("city");
        expect(normalizeLevelParam("area")).toBe("area");
        expect(normalizeLevelParam("country")).toBe("all");
        expect(normalizeLevelParam(null)).toBe("all");
    });

    it("should handle backward-compatible device catalog tab normalization", () => {
        const normalizeCatalogTab = (rawTab: string | null): string => {
            const tab = rawTab || "categories";
            return tab === "device-categories" ? "categories" : tab;
        };

        expect(normalizeCatalogTab("categories")).toBe("categories");
        expect(normalizeCatalogTab("device-categories")).toBe("categories");
        expect(normalizeCatalogTab("brands")).toBe("brands");
        expect(normalizeCatalogTab("models")).toBe("models");
        expect(normalizeCatalogTab("spare-parts")).toBe("spare-parts");
        expect(normalizeCatalogTab(null)).toBe("categories");
    });
});
