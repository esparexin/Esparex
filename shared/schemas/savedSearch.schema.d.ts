import { z } from "zod";
export declare const SavedSearchCreateSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    priceMin: z.ZodOptional<z.ZodNumber>;
    priceMax: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type SavedSearchCreatePayload = z.infer<typeof SavedSearchCreateSchema>;
