import { describe, expect, it } from "vitest";

import {
    hasCanonicalLocationId,
    isRegionLocationLevel,
    shouldUseExactLocationHierarchy,
    shouldUseGeoRadiusLocation,
    isUserSelectedLocation,
    shouldApplyLocationFilter,
} from "@/lib/location/queryMode";

describe("location query mode", () => {
    it("validates canonical locationId format", () => {
        const canonical = {
            source: "manual" as const,
            locationId: "507f1f77bcf86cd799439011",
            level: "city" as const,
            coordinates: { type: "Point" as const, coordinates: [79.44, 16.48] as [number, number] },
        };
        const nonCanonical = {
            source: "manual" as const,
            locationId: "hyderabad",
            level: "city" as const,
            coordinates: { type: "Point" as const, coordinates: [78.4867, 17.3850] as [number, number] },
        };

        expect(hasCanonicalLocationId(canonical)).toBe(true);
        expect(hasCanonicalLocationId(nonCanonical)).toBe(false);
        expect(shouldUseExactLocationHierarchy(canonical)).toBe(false);
    });

    it("allows city-level selections with coordinates to use geo radius mode", () => {
        const manualCity = {
            source: "manual" as const,
            locationId: "507f1f77bcf86cd799439011",
            level: "city" as const,
            coordinates: { type: "Point" as const, coordinates: [79.44, 16.48] as [number, number] },
        };
        const autoCity = {
            source: "auto" as const,
            locationId: "507f1f77bcf86cd799439011",
            level: "city" as const,
            coordinates: { type: "Point" as const, coordinates: [79.44, 16.48] as [number, number] },
        };

        expect(shouldUseGeoRadiusLocation(manualCity)).toBe(true);
        expect(shouldUseGeoRadiusLocation(autoCity)).toBe(true);
    });

    it("never uses geo radius mode for state or country levels", () => {
        expect(isRegionLocationLevel("state")).toBe(true);
        expect(isRegionLocationLevel("country")).toBe(true);
        expect(isRegionLocationLevel("city")).toBe(false);
        expect(
            shouldUseGeoRadiusLocation({
                source: "manual",
                locationId: "507f1f77bcf86cd799439011",
                level: "state",
                coordinates: { type: "Point", coordinates: [78.48, 17.38] },
            })
        ).toBe(false);
    });

    it("correctly identifies user selected locations and filter eligibility", () => {
        const defaultLoc = {
            source: "default" as const,
            locationId: undefined,
            coordinates: { type: "Point" as const, coordinates: [78.96, 20.59] as [number, number] },
        };
        const userLoc = {
            source: "manual" as const,
            locationId: "507f1f77bcf86cd799439011",
            coordinates: { type: "Point" as const, coordinates: [79.44, 16.48] as [number, number] },
        };

        expect(isUserSelectedLocation(defaultLoc)).toBe(false);
        expect(isUserSelectedLocation(userLoc)).toBe(true);
        expect(shouldApplyLocationFilter(defaultLoc)).toBe(false);
        expect(shouldApplyLocationFilter(defaultLoc, "507f1f77bcf86cd799439011")).toBe(true);
        expect(shouldApplyLocationFilter(userLoc)).toBe(true);
    });
});
