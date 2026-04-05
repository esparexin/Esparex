/**
 * Spare Part Listing Payload Schema — shared between backend controller and frontend form.
 *
 * Backend controller: validates req.body on POST /api/v1/spare-part-listings
 * Frontend form: extends BaseSparePartPayloadSchema for UI-only fields before upload
 *
 * Field name SSOT: 'title' (not 'partName' — partPayload.schema.ts was legacy and is now deleted)
 */
import { z } from 'zod';
import { validatedTextSchema } from './text.schema';

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');

export const BaseSparePartPayloadSchema = z.object({
    categoryId: objectIdSchema,
    sparePartId: objectIdSchema,
    brandId: objectIdSchema.optional(),

    title: validatedTextSchema({
        fieldName: 'Title',
        minLength: 5,
        maxLength: 120,
        strictMode: true,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true,
    }),

    description: validatedTextSchema({
        fieldName: 'Description',
        minLength: 10,
        maxLength: 2000,
        strictMode: false,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true,
    }),

    price: z.number().min(0, 'Price must be at least 0'),
    images: z.array(z.string()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
});

/** Full create schema — used by backend POST handler */
export const SparePartPayloadSchema = BaseSparePartPayloadSchema;

/** Partial update schema — used by backend PATCH handler */
export const PartialSparePartPayloadSchema = BaseSparePartPayloadSchema.partial();

export type SparePartPayload = z.infer<typeof SparePartPayloadSchema>;
export type PartialSparePartPayload = z.infer<typeof PartialSparePartPayloadSchema>;
