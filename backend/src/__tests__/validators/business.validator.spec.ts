import {
    adminBusinessAccountsQuerySchema,
    adminBusinessUpdateSchema,
    createBusinessSchema,
    publicBusinessQuerySchema,
    updateBusinessSchema,
} from "@core/validators/business.validator";

const issueMessages = (result: { success: false; error?: { issues: Array<{ message: string }> } }) =>
    result.error?.issues.map((issue) => issue.message).join(" ") || "";

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

    it("rejects legacy phone as a business write alias", () => {
        const result = createBusinessSchema.safeParse({
            ...validPayload,
            mobile: undefined,
            phone: "9876543210",
        });

        expect(result.success).toBe(false);
        expect(issueMessages(result as { success: false; error?: { issues: Array<{ message: string }> } })).toMatch(/phone/i);
    });
});

describe("update business mutation contracts", () => {
    it("accepts canonical mobile on owner updates", () => {
        const result = updateBusinessSchema.safeParse({
            mobile: "9876543210",
        });

        expect(result.success).toBe(true);
    });

    it("rejects legacy phone on owner updates", () => {
        const result = updateBusinessSchema.safeParse({
            phone: "9876543210",
        });

        expect(result.success).toBe(false);
        expect(issueMessages(result as { success: false; error?: { issues: Array<{ message: string }> } })).toMatch(/phone/i);
    });
});

describe("admin business update contracts", () => {
    it("accepts canonical mobile on admin updates", () => {
        const result = adminBusinessUpdateSchema.safeParse({
            mobile: "9876543210",
        });

        expect(result.success).toBe(true);
    });

    it("rejects legacy phone on admin updates", () => {
        const result = adminBusinessUpdateSchema.safeParse({
            phone: "9876543210",
        });

        expect(result.success).toBe(false);
        expect(issueMessages(result as { success: false; error?: { issues: Array<{ message: string }> } })).toMatch(/phone/i);
    });
});

describe("business query contracts", () => {
    it("accepts canonical public business discovery filters", () => {
        const parsed = publicBusinessQuerySchema.parse({
            locationId: "65f0a1b2c3d4e5f607182930",
            listingCategoryId: "65f0a1b2c3d4e5f607182931",
            brandId: "65f0a1b2c3d4e5f607182932",
            limit: "12",
            serviceOnly: "true",
        });

        expect(parsed.locationId).toBe("65f0a1b2c3d4e5f607182930");
        expect(parsed.listingCategoryId).toBe("65f0a1b2c3d4e5f607182931");
        expect(parsed.brandId).toBe("65f0a1b2c3d4e5f607182932");
        expect(parsed.limit).toBe(12);
        expect(parsed.serviceOnly).toBe("true");
    });

    it("rejects legacy city/category public business aliases", () => {
        expect(() => publicBusinessQuerySchema.parse({
            city: "Pune",
            category: "phones",
        })).toThrow(/city|category/i);
    });

    it("accepts canonical admin business account filters", () => {
        const parsed = adminBusinessAccountsQuerySchema.parse({
            status: "all",
            q: "repair hub",
            locationId: "65f0a1b2c3d4e5f607182930",
            page: "2",
            limit: "20",
        });

        expect(parsed.q).toBe("repair hub");
        expect(parsed.locationId).toBe("65f0a1b2c3d4e5f607182930");
        expect(parsed.page).toBe(2);
        expect(parsed.limit).toBe(20);
    });

    it("rejects legacy admin business search/city aliases", () => {
        expect(() => adminBusinessAccountsQuerySchema.parse({
            search: "repair hub",
            city: "Pune",
        })).toThrow(/search|city/i);
    });
});
