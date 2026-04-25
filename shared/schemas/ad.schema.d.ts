import { z } from "zod";
export declare const AdSchema: z.ZodObject<{
    id: z.ZodPipe<z.ZodUnion<[z.ZodString, z.ZodNumber]>, z.ZodTransform<string, string | number>>;
    title: z.ZodString;
    price: z.ZodNumber;
    description: z.ZodString;
    images: z.ZodArray<z.ZodString>;
    listingType: z.ZodOptional<z.ZodEnum<{
        ad: "ad";
        service: "service";
        spare_part: "spare_part";
    }>>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    category: z.ZodOptional<z.ZodString>;
    seoSlug: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    categoryName: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodString>;
    brandName: z.ZodOptional<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    modelName: z.ZodOptional<z.ZodString>;
    screenSize: z.ZodOptional<z.ZodString>;
    location: z.ZodObject<{
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        display: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        locationId: z.ZodOptional<z.ZodString>;
        coordinates: z.ZodOptional<z.ZodObject<{
            type: z.ZodLiteral<"Point">;
            coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        }, z.core.$strip>>;
    }, z.core.$loose>;
    sellerId: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        live: "live";
        rejected: "rejected";
        expired: "expired";
        deactivated: "deactivated";
        sold: "sold";
    }>;
    sellerType: z.ZodOptional<z.ZodEnum<{
        user: "user";
        business: "business";
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodOptional<z.ZodString>;
    views: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodObject<{
        total: z.ZodNumber;
        unique: z.ZodNumber;
        lastViewedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>]>>;
    deviceCondition: z.ZodOptional<z.ZodEnum<{
        power_on: "power_on";
        power_off: "power_off";
    }>>;
    brand: z.ZodOptional<z.ZodString>;
    isFeatured: z.ZodOptional<z.ZodBoolean>;
    isPremium: z.ZodOptional<z.ZodBoolean>;
    isBusiness: z.ZodOptional<z.ZodBoolean>;
    verified: z.ZodOptional<z.ZodBoolean>;
    inquiries: z.ZodOptional<z.ZodNumber>;
    likes: z.ZodOptional<z.ZodNumber>;
    spareParts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        _id: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>]>>>;
    sparePartsSnapshot: z.ZodOptional<z.ZodArray<z.ZodObject<{
        _id: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        brand: z.ZodString;
    }, z.core.$strip>>>;
    image: z.ZodOptional<z.ZodString>;
    time: z.ZodOptional<z.ZodString>;
    businessName: z.ZodOptional<z.ZodString>;
    businessId: z.ZodOptional<z.ZodString>;
    businessType: z.ZodOptional<z.ZodString>;
    businessCategory: z.ZodOptional<z.ZodString>;
    businessCity: z.ZodOptional<z.ZodString>;
    businessState: z.ZodOptional<z.ZodString>;
    businessExpiresAt: z.ZodOptional<z.ZodString>;
    sellerName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    isSpotlight: z.ZodOptional<z.ZodBoolean>;
    isBoosted: z.ZodOptional<z.ZodBoolean>;
    expiresAt: z.ZodOptional<z.ZodString>;
    spotlightExpiresAt: z.ZodOptional<z.ZodString>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export type Ad = z.infer<typeof AdSchema>;
