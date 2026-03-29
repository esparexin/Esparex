import { z } from "zod";

const trimString = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const optionalTrimmedString = <T extends z.ZodString>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, schema.optional());

export const smartAlertFormSchema = z.object({
  name: z.preprocess(
    trimString,
    z
      .string()
      .min(3, "Alert name must be between 3 and 50 characters.")
      .max(50, "Alert name must be between 3 and 50 characters.")
  ),
  keywords: z.preprocess(
    trimString,
    z
      .string()
      .min(1, "Search keywords are required.")
      .max(150, "Search keywords must be 150 characters or fewer.")
  ),
  category: optionalTrimmedString(
    z.string().max(80, "Category must be 80 characters or fewer.")
  ),
  location: optionalTrimmedString(
    z.string().max(120, "Location must be 120 characters or fewer.")
  ),
  radius: z.coerce
    .number({ invalid_type_error: "Radius must be a number." })
    .min(1, "Radius must be between 1 and 500 km.")
    .max(500, "Radius must be between 1 and 500 km."),
  emailNotifications: z.boolean(),
  locationId: z.string().optional().nullable(),
});

export type SmartAlertFormValues = z.infer<typeof smartAlertFormSchema>;
