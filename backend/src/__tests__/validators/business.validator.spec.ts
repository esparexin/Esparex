import { createBusinessSchema } from "../../validators/business.validator";

describe("createBusinessSchema", () => {
    const validPayload = {
        name: "City Repair Hub",
        description: "Professional device repair business with walk-in support and verified service coverage.",
        businessTypes: ["Repair services"],
        location: {
            address: "Shop 4, MG Road, Near Metro, Hyderabad, Telangana 500001",
            display: "Abids, Hyderabad",
            city: "Hyderabad",
            state: "Telangana",
            country: "India",
            coordinates: {
                type: "Point" as const,
                coordinates: [78.4867, 17.385],
            },
        },
        mobile: "9876543210",
        email: "owner@example.com",
        images: ["https://example.com/shop-1.jpg"],
        documents: {
            idProofType: "aadhaar",
            idProof: ["https://example.com/id-proof.pdf"],
            businessProof: ["https://example.com/business-proof.pdf"],
            certificates: [],
        },
    };

    it("requires current-location coordinates for business registration", () => {
        const result = createBusinessSchema.safeParse({
            ...validPayload,
            location: {
                ...validPayload.location,
                coordinates: undefined,
            },
        });

        expect(result.success).toBe(false);
        expect(
            result.error?.issues.some(
                (issue) => issue.path.join(".") === "location.coordinates" && issue.message === "Required",
            ),
        ).toBe(true);
    });

    it("accepts the payload without a canonical locationId", () => {
        const result = createBusinessSchema.safeParse(validPayload);

        expect(result.success).toBe(true);
    });
});
