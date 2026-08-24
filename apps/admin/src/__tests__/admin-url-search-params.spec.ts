import { describe, it, expect } from "vitest";
import {
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
    buildUrlWithSearchParams,
} from "../lib/urlSearchParams";

describe("normalizeSearchParamValue", () => {
    it("trims valid strings", () => {
        expect(normalizeSearchParamValue("  hello  ")).toBe("hello");
    });

    it("returns empty string for null/undefined", () => {
        expect(normalizeSearchParamValue(null)).toBe("");
        expect(normalizeSearchParamValue(undefined)).toBe("");
    });
});

describe("parsePositiveIntParam", () => {
    it("parses valid positive integers", () => {
        expect(parsePositiveIntParam("5")).toBe(5);
        expect(parsePositiveIntParam("100")).toBe(100);
    });

    it("returns fallback for invalid values", () => {
        expect(parsePositiveIntParam("abc")).toBe(1);
        expect(parsePositiveIntParam("0")).toBe(1);
        expect(parsePositiveIntParam("-3")).toBe(1);
        expect(parsePositiveIntParam(null)).toBe(1);
        expect(parsePositiveIntParam(undefined)).toBe(1);
    });

    it("uses custom fallback", () => {
        expect(parsePositiveIntParam("invalid", 10)).toBe(10);
    });
});

describe("updateSearchParams", () => {
    it("adds new params", () => {
        const result = updateSearchParams({ toString: () => "" }, { page: 2 });
        expect(result.get("page")).toBe("2");
    });

    it("removes null/undefined params", () => {
        const result = updateSearchParams({ toString: () => "page=2&q=test" }, { q: null });
        expect(result.has("q")).toBe(false);
        expect(result.get("page")).toBe("2");
    });

    it("removes empty trimmed string params", () => {
        const result = updateSearchParams({ toString: () => "q=old" }, { q: "   " });
        expect(result.has("q")).toBe(false);
    });

    it("updates existing params", () => {
        const result = updateSearchParams({ toString: () => "page=1" }, { page: 5 });
        expect(result.get("page")).toBe("5");
    });
});

describe("buildUrlWithSearchParams", () => {
    it("appends query string to pathname", () => {
        const params = new URLSearchParams("page=1&status=live");
        expect(buildUrlWithSearchParams("/ads", params)).toBe("/ads?page=1&status=live");
    });

    it("returns clean pathname when no params", () => {
        const params = new URLSearchParams();
        expect(buildUrlWithSearchParams("/ads", params)).toBe("/ads");
    });
});
