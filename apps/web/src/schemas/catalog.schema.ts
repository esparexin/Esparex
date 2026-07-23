import { z } from "zod";
import {
  CategorySchema,
  BrandSchema,
  ModelSchema,
  SparePartSchema,
  ServiceTypeSchema,
  ScreenSizeSchema,
  type Category,
  type Brand,
  type Model,
  type SparePart,
  type ServiceType,
  type ScreenSize,
} from "@esparex/contracts";

export {
  CategorySchema,
  BrandSchema,
  ModelSchema,
  SparePartSchema,
  ServiceTypeSchema,
  ScreenSizeSchema,
  type Category,
  type Brand,
  type Model,
  type SparePart,
  type ServiceType,
  type ScreenSize,
};

export const DeviceConditionSchema = z.object({
    id: z.string(),
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
}).passthrough();

export type DeviceCondition = z.infer<typeof DeviceConditionSchema>;
