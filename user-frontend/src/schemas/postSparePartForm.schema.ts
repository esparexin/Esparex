import { z } from "zod";
import {
    BaseSparePartPayloadSchema,
    PartialSparePartPayloadSchema,
} from "@shared/schemas/sparePartPayload.schema";

const stringId = z.string().optional();
const requiredStringId = z.string().min(1, "Required");

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
    images: z.array(z.string()).min(1, "At least one image is required").max(10, "Maximum 10 images allowed"),
});

export type PostSparePartFormValues = z.infer<typeof PostSparePartFormSchema>;
