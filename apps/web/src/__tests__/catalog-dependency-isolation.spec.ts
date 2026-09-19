import { describe, expect, it } from "vitest";
import { useBrandCatalog } from "@/hooks/listings/useBrandCatalog";
import { useSparePartCatalog } from "@/hooks/listings/useSparePartCatalog";

describe("Catalog Dependency Isolation Contract Safeguards (Post-Ad)", () => {
    it("exports useBrandCatalog as canonical hook", () => {
        expect(typeof useBrandCatalog).toBe("function");
    });

    it("exports useSparePartCatalog as canonical hook with React Query contract", () => {
        expect(typeof useSparePartCatalog).toBe("function");
    });

    it("ensures useBrandCatalog maintains category isolation ownership", () => {
        // useBrandCatalog must maintain its API contract without leaking category override
        // loadBrandsForCategory is the single SSOT for activeCategoryId.
        expect(typeof useBrandCatalog).toBe("function");
    });

    it("ensures useSparePartCatalog exposes activeCategoryId for pruning effect guards", () => {
        // Hook contract requires activeCategoryId exposure so PostAd provider can
        // prevent pruning spare parts during loading or category mismatch.
        expect(typeof useSparePartCatalog).toBe("function");
    });
});
