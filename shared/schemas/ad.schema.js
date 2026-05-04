"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdSchema = void 0;
const zod_1 = require("zod");
const coordinates_schema_1 = require("./coordinates.schema");
const listingType_1 = require("../enums/listingType");
const listingStatus_1 = require("../enums/listingStatus");
exports.AdSchema = zod_1.z.object({
    id: zod_1.z.string().or(zod_1.z.number()).transform(String),
    title: zod_1.z.string(),
    price: zod_1.z.number(),
    description: zod_1.z.string(),
    images: zod_1.z.array(zod_1.z.string()),
    listingType: zod_1.z.enum(listingType_1.LISTING_TYPE_VALUES).optional(),
    attributes: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    category: zod_1.z.string().optional(),
    seoSlug: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
    categoryName: zod_1.z.string().optional(),
    brandId: zod_1.z.string().optional(),
    brandName: zod_1.z.string().optional(),
    modelId: zod_1.z.string().optional(),
    modelName: zod_1.z.string().optional(),
    screenSize: zod_1.z.string().optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        display: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        locationId: zod_1.z.string().optional(),
        coordinates: coordinates_schema_1.coordinatesSchema.optional(),
    }).passthrough(),
    sellerId: zod_1.z.string(), // Canonical Ownership Key (SSOT)
    status: zod_1.z.enum(listingStatus_1.LISTING_DISPLAY_STATUS_VALUES),
    sellerType: zod_1.z.enum(['business', 'user']).optional(),
    createdAt: zod_1.z.string().datetime({ offset: true }),
    updatedAt: zod_1.z.string().datetime({ offset: true }).optional(),
    views: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.object({
            total: zod_1.z.number(),
            unique: zod_1.z.number(),
            lastViewedAt: zod_1.z.string().datetime({ offset: true }).optional(),
        })
    ]).optional(),
    deviceCondition: zod_1.z.enum(['power_on', 'power_off']).optional(),
    brand: zod_1.z.string().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    isPremium: zod_1.z.boolean().optional(),
    isBusiness: zod_1.z.boolean().optional(),
    verified: zod_1.z.boolean().optional(),
    inquiries: zod_1.z.number().optional(),
    likes: zod_1.z.number().optional(),
    spareParts: zod_1.z.array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            _id: zod_1.z.string().optional(),
            id: zod_1.z.string().optional(),
            name: zod_1.z.string().optional(),
            slug: zod_1.z.string().optional(),
            type: zod_1.z.string().optional()
        }).passthrough()
    ])).optional(),
    sparePartsSnapshot: zod_1.z.array(zod_1.z.object({
        _id: zod_1.z.string(),
        id: zod_1.z.string().optional(),
        name: zod_1.z.string(),
        brand: zod_1.z.string()
    })).optional(),
    image: zod_1.z.string().optional(), // Often derived from images[0]
    time: zod_1.z.string().optional(), // Often derived
    // Extended UI fields
    businessName: zod_1.z.string().optional(),
    businessId: zod_1.z.string().optional(),
    businessType: zod_1.z.string().optional(),
    businessCategory: zod_1.z.string().optional(),
    businessCity: zod_1.z.string().optional(),
    businessState: zod_1.z.string().optional(),
    businessExpiresAt: zod_1.z.string().optional(),
    sellerName: zod_1.z.string().optional(), // Normalized display name
    phone: zod_1.z.string().optional(),
    mobile: zod_1.z.string().optional(),
    isSpotlight: zod_1.z.boolean().optional(),
    isBoosted: zod_1.z.boolean().optional(),
    expiresAt: zod_1.z.string().datetime({ offset: true }).optional(),
    spotlightExpiresAt: zod_1.z.string().datetime({ offset: true }).optional(),
    rejectionReason: zod_1.z.string().optional(),
}).passthrough();
