import { z } from "zod";
import { smartAlertCriteriaSchema, smartAlertBodySchema } from "@esparex/contracts";

// criteriaSchema has .superRefine, so it's a ZodEffects. Use .innerType() to get ZodObject.
const criteriaSchema = smartAlertCriteriaSchema instanceof z.ZodEffects ? smartAlertCriteriaSchema.innerType() : smartAlertCriteriaSchema;
const criteriaShape = criteriaSchema.shape;

// bodySchema is a ZodObject (with .strict())
const bodyShape = smartAlertBodySchema.shape;

export const smartAlertFormSchema = z.object({
  name: z.string()
    .min(3, "Alert name must be between 3 and 50 characters.")
    .max(50, "Alert name must be between 3 and 50 characters."),
  keywords: z.string()
    .min(1, "Search keywords are required.")
    .max(150, "Search keywords must be 150 characters or fewer."),
  category: criteriaShape.category,
  location: criteriaShape.location,
  radiusKm: bodyShape.radiusKm instanceof z.ZodOptional ? bodyShape.radiusKm.unwrap() : bodyShape.radiusKm,
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
