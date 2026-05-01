import {
    PartialServicePayloadSchema,
    ServicePayloadSchema,
} from "@shared/schemas/servicePayload.schema";

describe("service payload contract", () => {
    const canonicalServiceTypeId = "507f1f77bcf86cd799439011";

    it("accepts canonical serviceTypeIds on create", () => {
        const parsed = ServicePayloadSchema.parse({
            title: "Board-level iPhone repair service",
            description: "Microsoldering and diagnostics for damaged iPhones with pickup available.",
            categoryId: "507f1f77bcf86cd799439012",
            images: ["https://example.com/service-1.jpg"],
            serviceTypeIds: [canonicalServiceTypeId],
        });

        expect(parsed.serviceTypeIds).toEqual([canonicalServiceTypeId]);
    });

    it("rejects the legacy serviceTypes alias on create", () => {
        expect(() => ServicePayloadSchema.parse({
            title: "Board-level iPhone repair service",
            description: "Microsoldering and diagnostics for damaged iPhones with pickup available.",
            categoryId: "507f1f77bcf86cd799439012",
            images: ["https://example.com/service-1.jpg"],
            serviceTypes: ["Screen Replacement"],
        })).toThrow(/serviceTypes|serviceTypeIds/i);
    });

    it("rejects the legacy serviceTypes alias on update", () => {
        expect(() => PartialServicePayloadSchema.parse({
            serviceTypes: ["Screen Replacement"],
        })).toThrow(/serviceTypes|serviceTypeIds/i);
    });
});
