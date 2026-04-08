import { describe, expect, it } from "vitest";

import {
    hasCanonicalLocationId,
    isRegionLocationLevel,
    shouldUseExactLocationHierarchy,
    shouldUseGeoRadiusLocation,
} from "@/lib/location/queryMode";

describe("location query mode", () => {
    it("treats manual canonical selections as exact hierarchy queries", () => {
        const location = {
            source: "manual" as const,
            locationId: "507f1f77bcf86cd799439011",
            level: "city" as const,
            coordinates: { type: "Point" as const, coordinates: [79.44, 16.48] as [number, number] },
        };

        expect(hasCanonicalLocationId(location)).toBe(true);
        expect(shouldUseExactLocationHierarchy(location)).toBe(true);
        expect(shouldUseGeoRadiusLocation(location)).toBe(false);
    });

    it("allows auto-detected city selections to keep geo radius mode", () => {
        const location = {
            source: "auto" as const,
            locationId: "507f1f77bcf86cd799439011",
            level: "city" as const,
            coordinates: { type: "Point" as const, coordinates: [79.44, 16.48] as [number, number] },
        };

        expect(shouldUseExactLocationHierarchy(location)).toBe(false);
        expect(shouldUseGeoRadiusLocation(location)).toBe(true);
    });

    it("never uses geo radius mode for state or country levels", () => {
        expect(isRegionLocationLevel("state")).toBe(true);
        expect(isRegionLocationLevel("country")).toBe(true);
        expect(
            shouldUseGeoRadiusLocation({
                source: "manual",
                locationId: "507f1f77bcf86cd799439011",
                level: "state",
                coordinates: { type: "Point", coordinates: [78.48, 17.38] },
            })
        ).toBe(false);
    });
});
