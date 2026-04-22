import { describe, expect, it } from "vitest";

import { parseStoredAppLocation } from "@/context/hooks/locationStorage.helpers";

describe("parseStoredAppLocation", () => {
    it("returns the stored location when the payload is valid and fresh", () => {
        const now = Date.UTC(2026, 3, 21);
        const stored = JSON.stringify({
            formattedAddress: "Hyderabad, Telangana",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            source: "manual",
            detectedAt: now - 1000,
        });

        expect(parseStoredAppLocation(stored, now)).toMatchObject({
            city: "Hyderabad",
            source: "manual",
        });
    });

    it("returns null for schema-invalid payloads instead of forcing the default location", () => {
        const invalid = JSON.stringify({
            source: "manual",
            city: "Hyderabad",
        });

        expect(parseStoredAppLocation(invalid)).toBeNull();
    });

    it("returns null when a stored auto-detected location is stale", () => {
        const now = Date.UTC(2026, 3, 21);
        const staleAuto = JSON.stringify({
            formattedAddress: "Hyderabad, Telangana",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            source: "auto",
            detectedAt: now - 8 * 24 * 60 * 60 * 1000,
        });

        expect(parseStoredAppLocation(staleAuto, now)).toBeNull();
    });
});
