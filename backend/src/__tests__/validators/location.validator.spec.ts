import {
    adminLocationListQuerySchema,
    logLocationEventSchema,
} from "../../validators/location.validator";

describe("location.validator", () => {
    it("accepts shared location event payloads with canonical objectId location references", () => {
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

    it("keeps backend-specific objectId validation for locationId", () => {
        const result = logLocationEventSchema.safeParse({
            source: "manual",
            city: "Hyderabad",
            state: "Telangana",
            reason: "manual_override",
            locationId: "not-an-object-id",
        });

        expect(result.success).toBe(false);
    });

    it("accepts canonical admin location list filters", () => {
        const parsed = adminLocationListQuerySchema.parse({
            q: "hyderabad",
            status: "active",
            state: "Telangana",
            page: "2",
            limit: "10",
        });

        expect(parsed.q).toBe("hyderabad");
        expect(parsed.status).toBe("active");
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(10);
    });

    it("rejects the legacy search alias in admin location filters", () => {
        expect(() => adminLocationListQuerySchema.parse({
            search: "hyderabad",
        })).toThrow(/search|q/i);
    });
});
