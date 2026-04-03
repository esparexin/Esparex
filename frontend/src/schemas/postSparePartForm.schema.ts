import { z } from "zod";
import {
    BaseSparePartPayloadSchema,
    PartialSparePartPayloadSchema,
} from "@shared/schemas/sparePartPayload.schema";

const locationMetaSchema = z.object({
    locationId: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    display: z.string().optional(),
    coordinates: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]),
    }).optional(),
}).optional();

const stringId = z.string().optional();
const requiredStringId = z.string().min(1, "Required");

export const PostSparePartFormSchema = BaseSparePartPayloadSchema
    .omit({
        sparePartId: true,
        location: true,
        locationId: true,
        categoryId: true,
        brandId: true,
        images: true,
    })
    .merge(z.object({
        categoryId: requiredStringId,
        brandId: stringId,
        sparePartTypeId: requiredStringId,
        location: locationMetaSchema,
    }));

export const EditPostSparePartFormSchema = PartialSparePartPayloadSchema.pick({
    title: true,
    description: true,
    price: true,
}).extend({
    images: z.array(z.string()).min(1, "At least one image is required").max(10, "Maximum 10 images allowed"),
});

export type PostSparePartFormValues = z.infer<typeof PostSparePartFormSchema>;
