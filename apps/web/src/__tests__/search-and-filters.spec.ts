import { describe, expect, it } from "vitest";
import {
    parseSearchHistory,
    addSearchQueryToHistory,
    POPULAR_SEARCHES,
} from "@/hooks/useSearchHistory";
import fs from "fs";
import path from "path";

describe("Phase 5: Search & Filter State Wiring (FIND-004, FIND-005, FIND-018)", () => {
    const webSrcDir = path.resolve(__dirname, "..");

    it("parses stored search history and falls back cleanly on invalid payloads", () => {
        expect(parseSearchHistory(null)).toEqual([]);
        expect(parseSearchHistory("invalid-json")).toEqual([]);
        expect(parseSearchHistory(JSON.stringify(["iPhone 14", "Pixel 7"]))).toEqual(["iPhone 14", "Pixel 7"]);
        expect(parseSearchHistory(JSON.stringify(["a", "b", "c", "d", "e", "f"]))).toHaveLength(5);
    });

    it("adds query to history, deduplicates case-insensitively, and limits to 5", () => {
        let history: string[] = [];

        history = addSearchQueryToHistory(history, "OnePlus 11");
        history = addSearchQueryToHistory(history, "iPhone 13");
        history = addSearchQueryToHistory(history, "Pixel 7");

        expect(history).toEqual(["Pixel 7", "iPhone 13", "OnePlus 11"]);

        // Adding duplicate bumps to first position
        history = addSearchQueryToHistory(history, "iphone 13");
        expect(history).toEqual(["iphone 13", "Pixel 7", "OnePlus 11"]);

        // Adding more items caps at 5
        history = addSearchQueryToHistory(history, "MacBook");
        history = addSearchQueryToHistory(history, "iPad");
        history = addSearchQueryToHistory(history, "Watch");

        expect(history).toHaveLength(5);
        expect(history[0]).toBe("Watch");
    });

    it("provides popular searches fallback when history is empty", () => {
        expect(POPULAR_SEARCHES).toContain("iPhone 15");
        expect(POPULAR_SEARCHES).toContain("Display Screen");
        expect(POPULAR_SEARCHES).toContain("Battery Replacement");
        expect(POPULAR_SEARCHES).toContain("Motherboard");
    });

    it("verifies BrowseListingsView wires minPrice, maxPrice, and condition to filters", () => {
        const filePath = path.join(webSrcDir, "components/user/BrowseListingsView.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).toContain('minPrice={minPrice}');
        expect(content).toContain('maxPrice={maxPrice}');
        expect(content).toContain('onPriceChange={handlePriceChange}');
        expect(content).toContain('deviceCondition={deviceConditionParam}');
        expect(content).toContain('onDeviceConditionChange={handleConditionChange}');
    });

    it("verifies Header search dropdown renders dynamic Recent / Popular Searches", () => {
        const filePath = path.join(webSrcDir, "components/user/header/HeaderSearchDropdown.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).toContain('isRecent ? "Recent Searches" : "Popular Searches"');
        expect(content).toContain('onClearHistory()');
    });

    it("verifies buildBaseBrowseFilters resolves category slug to canonical categoryId", async () => {
        const { buildBaseBrowseFilters } = await import("@/components/user/browseFilterBuilders");
        const mockCategories = [
            { id: "69c24a14a58d20c75c6b09d9", name: "LED TVs", slug: "led-tvs" },
            { id: "69c24a14a58d20c75c6b09da", name: "Mobiles", slug: "mobiles" },
        ];

        const filters = buildBaseBrowseFilters({
            page: 1,
            pageSize: 20,
            query: "",
            selectedCategory: "led-tvs",
            categories: mockCategories as any,
        });

        expect(filters.categoryId).toBe("69c24a14a58d20c75c6b09d9");
    });
});
