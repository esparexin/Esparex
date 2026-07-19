import { z } from "zod";
import {
    CategorySchema as SharedCategorySchema,
    BrandSchema as SharedBrandSchema,
    ModelSchema as SharedModelSchema,
    SparePartSchema as SharedSparePartSchema,
    ServiceTypeSchema as SharedServiceTypeSchema,
    ScreenSizeSchema as SharedScreenSizeSchema,
} from "@shared";

// Category Schema
export const CategorySchema = SharedCategorySchema.passthrough();

export const BrandSchema = SharedBrandSchema.passthrough();

export const ModelSchema = SharedModelSchema.passthrough();

export const DeviceConditionSchema = z.object({
    id: z.string(),
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
}).passthrough();

export const SparePartSchema = SharedSparePartSchema.passthrough();

export const ServiceTypeSchema = SharedServiceTypeSchema.passthrough();

export const ScreenSizeSchema = SharedScreenSizeSchema.passthrough();

// Type inference
export type Category = z.infer<typeof CategorySchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type DeviceCondition = z.infer<typeof DeviceConditionSchema>;
export type SparePart = z.infer<typeof SparePartSchema>;
export type ServiceType = z.infer<typeof ServiceTypeSchema>;
export type ScreenSize = z.infer<typeof ScreenSizeSchema>;
