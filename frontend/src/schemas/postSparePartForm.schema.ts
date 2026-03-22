import { z } from "zod";

/**
 * Schema for PostSparePartForm / SparePartListingContext.
 *
 * Field names match both the form and the shared BaseSparePartPayloadSchema:
 *   - sparePartId   (catalog SparePart ObjectId — canonical across all layers)
 *   - categoryId    (required for create)
 *
 * images are NOT validated here — useListingSubmission manages them separately.
 */
export const PostSparePartFormSchema = z.object({
    title: z.string().min(10, "Title must be at least 10 characters").max(60, "Title too long"),
    categoryId: z.string().min(1, "Please select a category"),
    brandId: z.string().optional(),
    sparePartId: z.string().min(1, "Please select a spare part type"),
    price: z.number({ invalid_type_error: "Enter a valid price" }).min(0, "Price must be at least 0"),
    description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description too long"),
    location: z.object({
        city: z.string(),
        state: z.string(),
        display: z.string().optional(),
        coordinates: z.object({
            type: z.literal("Point"),
            coordinates: z.tuple([z.number(), z.number()]),
        }),
        locationId: z.string().optional(),
    }).optional(),
});

export type PostSparePartFormValues = z.infer<typeof PostSparePartFormSchema>;
