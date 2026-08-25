import { describe, it, expect } from "vitest";
import { buildQueryString } from "../lib/api/queryParams";

describe("Admin buildQueryString", () => {
    it("returns empty string for undefined/empty filters", () => {
        expect(buildQueryString()).toBe("");
        expect(buildQueryString(undefined)).toBe("");
        expect(buildQueryString({})).toBe("");
    });

    it("serializes string values", () => {
        expect(buildQueryString({ status: "pending" })).toBe("status=pending");
    });

    it("serializes numeric values", () => {
        expect(buildQueryString({ page: 1, limit: 20 })).toContain("page=1");
        expect(buildQueryString({ page: 1, limit: 20 })).toContain("limit=20");
    });

    it("serializes boolean values", () => {
        expect(buildQueryString({ active: true })).toBe("active=true");
        expect(buildQueryString({ active: false })).toBe("active=false");
    });

    it("skips null and undefined values", () => {
        const result = buildQueryString({ status: "live", category: null, brand: undefined });
        expect(result).toBe("status=live");
    });

    it("skips empty string values by default", () => {
        const result = buildQueryString({ status: "live", q: "" });
        expect(result).toBe("status=live");
    });

    it("includes empty string when skipEmptyString is false", () => {
        const result = buildQueryString({ q: "" }, { skipEmptyString: false });
        expect(result).toBe("q=");
    });

    it("handles mixed param types", () => {
        const result = buildQueryString({
            status: "pending",
            page: 2,
            featured: true,
            removed: null,
        });
        expect(result).toContain("status=pending");
        expect(result).toContain("page=2");
        expect(result).toContain("featured=true");
        expect(result).not.toContain("removed");
    });
});
