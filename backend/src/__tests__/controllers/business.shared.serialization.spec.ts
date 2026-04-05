import {
    sanitizeBusinessForPublic,
    serializeBusinessForAdmin,
} from "../../controllers/business/shared";

describe("business shared serialization", () => {
    const persistedShopImage = "https://assets.esparex.com/businesses/shop-1.jpg";
    const persistedIdProof = "https://assets.esparex.com/documents/id-proof.pdf";
    const persistedBusinessProof = "https://assets.esparex.com/documents/business-proof.pdf";

    const sampleBusiness = {
        _id: "65f0a1b2c3d4e5f607182930",
        name: "City Repair Hub",
        mobile: "9876543210",
        businessTypes: ["Repair services", "Spare parts"],
        isVerified: true,
        images: [persistedShopImage],
        documents: [
            {
                type: "id_proof",
                url: persistedIdProof,
                version: 1,
            },
            {
                type: "business_proof",
                url: persistedBusinessProof,
                version: 1,
            },
        ],
        locationId: "65f0a1b2c3d4e5f607182931",
        location: {
            city: "Hyderabad",
            state: "Telangana",
            locationId: "65f0a1b2c3d4e5f607182931",
        },
        userId: {
            _id: "65f0a1b2c3d4e5f607182932",
            name: "Owner Name",
            email: "owner@example.com",
            mobile: "9876543210",
        },
    };

    it("serializes admin business payloads with stable compatibility aliases", () => {
        const serialized = serializeBusinessForAdmin(sampleBusiness);

        expect(serialized).toMatchObject({
            businessName: "City Repair Hub",
            phone: "9876543210",
            contactNumber: "9876543210",
            businessType: "Repair services",
            ownerId: "65f0a1b2c3d4e5f607182932",
            ownerName: "Owner Name",
            sellerId: {
                id: "65f0a1b2c3d4e5f607182932",
                name: "Owner Name",
                email: "owner@example.com",
                mobile: "9876543210",
            },
            location: {
                city: "Hyderabad",
                state: "Telangana",
                locationId: "65f0a1b2c3d4e5f607182931",
            },
        });
        expect(serialized.documents).toMatchObject({
            idProof: [persistedIdProof],
            businessProof: [persistedBusinessProof],
            certificates: [],
        });
        expect(serialized.shopImages).toEqual([persistedShopImage]);
        expect(serialized.gallery).toEqual([persistedShopImage]);
    });

    it("removes documents from public business payloads while keeping normalized media aliases", () => {
        const serialized = sanitizeBusinessForPublic(sampleBusiness);

        expect(serialized.documents).toBeUndefined();
        expect(serialized.businessName).toBe("City Repair Hub");
        expect(serialized.shopImages).toEqual([persistedShopImage]);
        expect(serialized.gallery).toEqual([persistedShopImage]);
        expect(serialized.location).toMatchObject({
            locationId: "65f0a1b2c3d4e5f607182931",
        });
    });
});
