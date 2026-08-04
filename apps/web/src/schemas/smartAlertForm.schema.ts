import { z } from "zod";
import { smartAlertCriteriaBaseSchema, smartAlertBodyBaseSchema } from "@esparex/contracts";

const criteriaShape = smartAlertCriteriaBaseSchema.shape;
const bodyShape = smartAlertBodyBaseSchema.shape;

export const smartAlertFormSchema = z.object({
  name: z.string().optional(),
  keywords: z.string().max(150, "Search keywords must be 150 characters or fewer.").optional().default(""),
  category: z.string().min(1, "Category is required."),
  location: criteriaShape.location,
  radiusKm: z.number().min(1).max(500).default(25),
  notificationChannels: bodyShape.notificationChannels instanceof z.ZodOptional ? bodyShape.notificationChannels.unwrap() : bodyShape.notificationChannels,
  locationId: criteriaShape.locationId,
  brand: criteriaShape.brand,
  model: criteriaShape.model,
  minPrice: criteriaShape.minPrice,
  maxPrice: criteriaShape.maxPrice,
  condition: criteriaShape.condition,
  state: criteriaShape.state,
});

export type SmartAlertFormValues = z.infer<typeof smartAlertFormSchema>;
