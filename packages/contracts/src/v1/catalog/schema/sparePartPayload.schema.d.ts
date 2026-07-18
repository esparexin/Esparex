/**
 * Spare Part Listing Payload Schema — shared between backend controller and frontend form.
 *
 * Backend controller: validates req.body on POST /api/v1/spare-part-listings
 * Frontend form: extends BaseSparePartPayloadSchema for UI-only fields before upload
 *
 * Field name SSOT: 'title' (not 'partName' — partPayload.schema.ts was legacy and is now deleted)
 */
import { z } from 'zod';
export declare const BaseSparePartPayloadSchema: z.ZodObject<{
    categoryId: z.ZodString;
    sparePartId: z.ZodString;
    brandId: z.ZodOptional<z.ZodString>;
    title: any;
    description: any;
    price: z.ZodNumber;
    images: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    categoryId?: unknown;
    sparePartId?: unknown;
    brandId?: unknown;
    title?: unknown;
    description?: unknown;
    price?: unknown;
    images?: unknown;
}, {
    [x: string]: any;
    categoryId?: unknown;
    sparePartId?: unknown;
    brandId?: unknown;
    title?: unknown;
    description?: unknown;
    price?: unknown;
    images?: unknown;
}>;
/** Full create schema — used by backend POST handler */
export declare const SparePartPayloadSchema: z.ZodObject<{
    categoryId: z.ZodString;
    sparePartId: z.ZodString;
    brandId: z.ZodOptional<z.ZodString>;
    title: any;
    description: any;
    price: z.ZodNumber;
    images: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    categoryId?: unknown;
    sparePartId?: unknown;
    brandId?: unknown;
    title?: unknown;
    description?: unknown;
    price?: unknown;
    images?: unknown;
}, {
    [x: string]: any;
    categoryId?: unknown;
    sparePartId?: unknown;
    brandId?: unknown;
    title?: unknown;
    description?: unknown;
    price?: unknown;
    images?: unknown;
}>;
/** Partial update schema — used by backend PATCH handler */
export declare const PartialSparePartPayloadSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    sparePartId: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<any>;
    description: z.ZodOptional<any>;
    price: z.ZodOptional<z.ZodNumber>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    [x: string]: any;
    categoryId?: unknown;
    sparePartId?: unknown;
    brandId?: unknown;
    title?: unknown;
    description?: unknown;
    price?: unknown;
    images?: unknown;
}, {
    [x: string]: any;
    categoryId?: unknown;
    sparePartId?: unknown;
    brandId?: unknown;
    title?: unknown;
    description?: unknown;
    price?: unknown;
    images?: unknown;
}>;
export type SparePartPayload = z.infer<typeof SparePartPayloadSchema>;
export type PartialSparePartPayload = z.infer<typeof PartialSparePartPayloadSchema>;
