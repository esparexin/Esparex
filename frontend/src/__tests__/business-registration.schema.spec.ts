import { describe, expect, it } from "vitest";
import { businessRegistrationSchema } from "@/schemas/businessRegistration.schema";

const validRegistrationPayload = {
    businessName: "City Repair Hub",
    businessDescription: "Professional mobile and laptop repair service with same-day diagnostics.",
    fullAddress: "Shop 4, MG Road, Near Metro, Hyderabad, Telangana 500001",
    currentLocationDisplay: "Abids, Hyderabad",
    currentLocationCity: "Hyderabad",
    currentLocationState: "Telangana",
    currentLocationCountry: "India",
    coordinates: {
        type: "Point" as const,
        coordinates: [78.4867, 17.385],
    },
    contactNumber: "9876543210",
    email: "owner@example.com",
    idProofType: "aadhaar",
    idProof: "https://example.com/id-proof.pdf",
    businessProof: "https://example.com/business-proof.pdf",
    certificates: [],
    shopImages: ["https://example.com/shop-1.jpg"],
};

describe("businessRegistrationSchema", () => {
    it("requires current location proof before submission", () => {
        const result = businessRegistrationSchema.safeParse({
            ...validRegistrationPayload,
            currentLocationDisplay: "",
            coordinates: null,
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.currentLocationDisplay).toContain("Use current location to continue");
        expect(result.error?.flatten().fieldErrors.coordinates).toContain("Use current location to continue");
    });

    it("requires a full address that includes a pincode", () => {
        const result = businessRegistrationSchema.safeParse({
            ...validRegistrationPayload,
            fullAddress: "Shop 4, MG Road, Near Metro, Hyderabad",
        });

        expect(result.success).toBe(false);
        expect(result.error?.flatten().fieldErrors.fullAddress).toContain(
            "Enter full address including 6-digit pincode",
        );
    });

    it("accepts the payload without a canonical locationId", () => {
        const result = businessRegistrationSchema.safeParse(validRegistrationPayload);

        expect(result.success).toBe(true);
    });
});
