import { z } from "zod";
export declare const SavedSearchCreateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
    priceMin: z.ZodOptional<z.ZodNumber>;
    priceMax: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query?: string | undefined;
    categoryId?: string | undefined;
    locationId?: string | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}, {
    query?: string | undefined;
    categoryId?: string | undefined;
    locationId?: string | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}>, {
    query?: string | undefined;
    categoryId?: string | undefined;
    locationId?: string | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}, {
    query?: string | undefined;
    categoryId?: string | undefined;
    locationId?: string | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}>, {
    query?: string | undefined;
    categoryId?: string | undefined;
    locationId?: string | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}, {
    query?: string | undefined;
    categoryId?: string | undefined;
    locationId?: string | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
}>;
export type SavedSearchCreatePayload = z.infer<typeof SavedSearchCreateSchema>;
//# sourceMappingURL=savedSearch.schema.d.ts.map