import { describe, expect, it } from "vitest";

import { appLocationSchema, logLocationEventSchema } from "@/schemas/location.schema";

describe("location contract schemas", () => {
    it("accepts a canonical app location payload", () => {
        const result = appLocationSchema.safeParse({
            formattedAddress: "Hyderabad, Telangana, India",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            source: "manual",
            locationId: "507f1f77bcf86cd799439011",
            level: "city",
            coordinates: {
                type: "Point",
                coordinates: [78.4867, 17.385],
            },
        });

        expect(result.success).toBe(true);
    });

    it("accepts a shared location event payload with optional analytics metadata", () => {
        const result = logLocationEventSchema.safeParse({
            source: "manual",
            city: "Hyderabad",
            state: "Telangana",
            reason: "manual_override",
            eventType: "location_search",
            locationId: "507f1f77bcf86cd799439011",
        });

        expect(result.success).toBe(true);
    });

    it("rejects invalid location event sources", () => {
        const result = logLocationEventSchema.safeParse({
            source: "gps",
            city: "Hyderabad",
            state: "Telangana",
            reason: "manual_override",
        });

        expect(result.success).toBe(false);
    });
});
