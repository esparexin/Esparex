import { describe, expect, it } from "vitest";
import { LocationFacade } from "@esparex/shared";
import { formatLocation as formatLocationWeb } from "@/lib/location/locationService";
import { normalizeToAppLocation } from "@/lib/location/locationService";
import { createPoint, getLatitude, getLongitude } from "@esparex/shared";

describe("Location Subsystem Empirical Runtime Instrumentation Trace", () => {
    it("1. Verifies LocationFacade SSOT identity and method availability", () => {
        expect(typeof LocationFacade.normalize).toBe("function");
        expect(typeof LocationFacade.format).toBe("function");
        expect(typeof LocationFacade.validate).toBe("function");
        expect(typeof LocationFacade.resolveId).toBe("function");

        console.log(`[EMPIRICAL LOCATION TRACE] LocationFacade methods verified: normalize, format, validate, resolveId.`);
    });

    it("2. Formatter Precedence Divergence Test — Compares Shared Facade vs Web formatters", () => {
        const sampleRawLocation = {
            display: "Indiranagar, Bengaluru, Karnataka",
            city: "Bengaluru",
            district: "Bengaluru Urban",
            state: "Karnataka",
        };

        const sharedFormatted = LocationFacade.format(sampleRawLocation);
        const webFormatted = formatLocationWeb(sampleRawLocation);

        console.log(`[EMPIRICAL FORMATTER TRACE] LocationFacade.format Output: "${sharedFormatted}"`);
        console.log(`[EMPIRICAL FORMATTER TRACE] Web formatLocation Output: "${webFormatted}"`);

        // Shared facade format prioritizes display ("Indiranagar, Bengaluru, Karnataka")
        expect(sharedFormatted).toBe("Indiranagar, Bengaluru, Karnataka");

        // Web formatLocation prioritizes city ("Bengaluru") for compact card display
        expect(webFormatted).toBe("Bengaluru");
    });

    it("3. GeoJSON Coordinate Contract Trace — Verifies [lng, lat] array ordering", () => {
        const point = createPoint(77.5946, 12.9716); // [lng, lat] for Bengaluru
        
        expect(point).toBeDefined();
        expect(point?.type).toBe("Point");
        expect(point?.coordinates[0]).toBe(77.5946); // Longitude
        expect(point?.coordinates[1]).toBe(12.9716); // Latitude

        const extractedLat = getLatitude(point);
        const extractedLng = getLongitude(point);

        console.log(`[EMPIRICAL GEOJSON TRACE] Extracted Latitude: ${extractedLat}, Longitude: ${extractedLng}`);

        expect(extractedLat).toBe(12.9716);
        expect(extractedLng).toBe(77.5946);
    });

    it("4. Storage Synchronization Trace — Verifies Location storage normalization", () => {
        const rawInput = {
            display: "Connaught Place, New Delhi",
            city: "New Delhi",
            state: "Delhi",
            coordinates: [77.2167, 28.6328], // [lng, lat]
            source: "manual",
        };

        const appLocation = normalizeToAppLocation(rawInput, "manual");

        console.log(`[EMPIRICAL STORAGE TRACE] Normalized AppLocation DTO:`, JSON.stringify(appLocation));

        expect(appLocation).not.toBeNull();
        expect(appLocation?.city).toBe("New Delhi");
        expect(appLocation?.display).toBe("Connaught Place, New Delhi");
        expect(appLocation?.coordinates?.coordinates).toEqual([77.2167, 28.6328]);
    });
});
