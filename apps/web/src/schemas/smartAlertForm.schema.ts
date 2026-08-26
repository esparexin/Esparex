import { z } from "zod";
import { smartAlertCriteriaBaseSchema, smartAlertBodyBaseSchema } from "@esparex/contracts";
import { validateText, getValidationError } from "@esparex/shared";

const criteriaShape = smartAlertCriteriaBaseSchema.shape;
const bodyShape = smartAlertBodyBaseSchema.shape;

export const smartAlertFormSchema = z
  .object({
    name: z.string().min(3, "Alert name must be at least 3 characters.").max(100).optional(),
    keywords: z
      .string()
      .max(150, "Search keywords must be 150 characters or fewer.")
      .optional()
      .default(""),
    category: z.string().min(1, "Category is required."),
    brand: z.string().min(1, "Brand is required."),
    model: z.string().optional().default(""),
    location: criteriaShape.location,
    radiusKm: z.number().min(1).max(500).default(25),
    notificationChannels: bodyShape.notificationChannels instanceof z.ZodOptional ? bodyShape.notificationChannels.unwrap() : bodyShape.notificationChannels,
    locationId: criteriaShape.locationId,
    minPrice: criteriaShape.minPrice,
    maxPrice: criteriaShape.maxPrice,
    condition: criteriaShape.condition,
    state: criteriaShape.state,
  })
  .superRefine((data, ctx) => {
    const hasModel = Boolean(data.model && data.model.trim().length > 0);
    const keywordsVal = data.keywords ? data.keywords.trim() : "";

    if (!hasModel && !keywordsVal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["keywords"],
        message: "Search keywords are required when no specific model is selected.",
      });
      return;
    }

    if (keywordsVal.length > 0) {
      const result = validateText(keywordsVal, {
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true,
        allowEmpty: true,
        maxLength: 150,
        strictMode: true,
      });
      if (!result.isValid) {
        const errorMsg = getValidationError(result) || "Search keywords contain invalid or prohibited text.";
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["keywords"],
          message: errorMsg,
        });
      }
    }
  });

export type SmartAlertFormValues = z.infer<typeof smartAlertFormSchema>;

