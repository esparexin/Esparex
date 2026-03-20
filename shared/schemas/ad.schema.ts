import { z } from "zod";
import { coordinatesSchema } from "./coordinates.schema";

export const AdSchema = z.object({
    id: z.string().or(z.number()).transform(String),
    title: z.string(),
    price: z.number(),
    description: z.string(),
    images: z.array(z.string()),
    listingType: z.enum(['ad', 'service', 'spare_part']).optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    category: z.string().optional(),
    seoSlug: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    modelId: z.string().optional(),
    screenSize: z.string().optional(),
    location: z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        display: z.string().optional(),
        address: z.string().optional(),
        locationId: z.string().optional(),
        coordinates: coordinatesSchema.optional(),
    }).passthrough(),
    sellerId: z.string(), // Canonical Ownership Key
    userId: z.string().optional(), // Legacy Alias (Deprecated)
    ownerId: z.string().optional(), // Future Canonical Key
    status: z.enum(['live', 'pending', 'sold', 'expired', 'rejected', 'deactivated']),
    sellerType: z.enum(['business', 'user']).optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    views: z.union([
        z.number(),
        z.object({
            total: z.number(),
            unique: z.number(),
            lastViewedAt: z.string().optional(),
        })
    ]).optional(),
    deviceCondition: z.enum(['power_on', 'power_off']).optional(),

    brand: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    isBusiness: z.boolean().optional(),
    verified: z.boolean().optional(),
    inquiries: z.number().optional(),
    likes: z.number().optional(),
    spareParts: z.array(z.union([
        z.string(),
        z.object({
            _id: z.string().optional(),
            id: z.string().optional(),
            name: z.string().optional(),
            slug: z.string().optional(),
            type: z.string().optional()
        }).passthrough()
    ])).optional(),
    sparePartsSnapshot: z.array(z.object({
        _id: z.string(),
        id: z.string().optional(),
        name: z.string(),
        brand: z.string()
    })).optional(),
    image: z.string().optional(), // Often derived from images[0]
    time: z.string().optional(), // Often derived
    seller: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(), // Allow string or object (legacy), but prefer explicit fields below
    // Extended UI fields
    businessName: z.string().optional(),
    businessId: z.string().optional(),
    sellerName: z.string().optional(), // Normalized display name
    phone: z.string().optional(),
    mobile: z.string().optional(),

    isSpotlight: z.boolean().optional(),
    isBoosted: z.boolean().optional(),
    expiresAt: z.string().optional(),
    spotlightExpiresAt: z.string().optional(),
    rejectionReason: z.string().optional(),
}).passthrough();

export type Ad = z.infer<typeof AdSchema>;
