/**
 * Spare Part Listing Payload Schema — shared between backend controller and frontend form.
 *
 * Backend controller: validates req.body on POST /api/v1/listings (unified Listing endpoint)
 * Frontend form: extends BaseSparePartPayloadSchema for UI-only fields before upload
 *
 * Field name SSOT: 'title' (not 'partName' — partPayload.schema.ts was legacy and is now deleted)
 */
import { z } from 'zod';
import { PRICE_LIMITS, SPARE_PART_LIMITS, TEXT_LIMITS } from '../../common/constants/fieldLimits';
import { objectIdSchema } from '../../common/schema/common.schemas';
import { validatedTextSchema } from '../../common/schema/text.schema';

export const BaseSparePartPayloadSchema = z.object({
    categoryId: objectIdSchema,
    sparePartId: objectIdSchema,
    brandId: objectIdSchema.optional(),

    title: validatedTextSchema({
        fieldName: 'Title',
        minLength: SPARE_PART_LIMITS.TITLE.MIN,
        maxLength: SPARE_PART_LIMITS.TITLE.MAX,
        }),

    description: validatedTextSchema({
        fieldName: 'Description',
        minLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MIN,
        maxLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MAX,
        }),

    price: z.number().min(PRICE_LIMITS.MIN, PRICE_LIMITS.ERROR_MIN).max(PRICE_LIMITS.MAX, PRICE_LIMITS.ERROR_MAX),
    images: z.array(z.string()).min(SPARE_PART_LIMITS.IMAGES.MIN, SPARE_PART_LIMITS.IMAGES.ERROR_MIN).max(SPARE_PART_LIMITS.IMAGES.MAX, SPARE_PART_LIMITS.IMAGES.ERROR_MAX),
});

/** Full create schema — used by backend POST handler */
export const SparePartPayloadSchema = BaseSparePartPayloadSchema;

/** Partial update schema — used by backend PATCH handler */
export const PartialSparePartPayloadSchema = BaseSparePartPayloadSchema.partial();

const stringId = z.string().optional();
const requiredStringId = z.string().min(1, 'Required');

export const PostSparePartFormSchema = BaseSparePartPayloadSchema
    .omit({
        sparePartId: true,
        categoryId: true,
        brandId: true,
        images: true,
    })
    .merge(z.object({
        categoryId: requiredStringId,
        brandId: stringId,
        sparePartTypeId: requiredStringId,
    }));

export const EditPostSparePartFormSchema = PartialSparePartPayloadSchema.pick({
    title: true,
    description: true,
    price: true,
}).extend({
    images: z.array(z.string()).min(SPARE_PART_LIMITS.IMAGES.MIN, SPARE_PART_LIMITS.IMAGES.ERROR_MIN).max(SPARE_PART_LIMITS.IMAGES.MAX, SPARE_PART_LIMITS.IMAGES.ERROR_MAX),
});

export type SparePartPayload = z.infer<typeof SparePartPayloadSchema>;
export type PartialSparePartPayload = z.infer<typeof PartialSparePartPayloadSchema>;
export type PostSparePartFormValues = z.infer<typeof PostSparePartFormSchema>;
