import { z } from 'zod';

// v3-native LocationMeta — avoids Zod v3/v4 version mixing.
const locationMetaSchema = z.object({
    locationId: z.string().optional(),
    parentId: z.string().nullable().optional(),
    path: z.array(z.string()).optional(),
    name: z.string().optional(),
    display: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    level: z.enum(['country', 'state', 'district', 'city', 'area', 'village']).optional(),
    isActive: z.boolean().optional(),
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()])
    }).optional(),
});

export const SparePartListingPayloadSchema = z.object({
    category: z.string().min(1, "Category is required"),
    categoryId: z.string().optional(),

    brand: z.string().optional(),
    brandId: z.string().optional(),

    sparePartId: z.string().min(1, "Spare part is required"),
    sparePartName: z.string().optional(),

    compatibleModels: z.array(z.string()).optional(),

    title: z.string().trim().min(5, "Title must be at least 5 characters").max(120, "Title too long"),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),

    price: z.number().min(0, "Price must be 0 or more"),

    images: z.array(z.string()).min(1, "At least one image is required"),

    location: locationMetaSchema,
    locationId: z.string().optional(),
});

export type SparePartListingFormData = z.infer<typeof SparePartListingPayloadSchema>;
