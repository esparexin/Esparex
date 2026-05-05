import { z } from "zod";

const objectIdLike = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const SavedSearchCreateSchema = z
  .object({
    query: z.string().trim().max(120).optional(),
    categoryId: objectIdLike.optional(),
    locationId: objectIdLike.optional(),
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().min(0).optional(),
  })
  .refine(
    (payload) =>
      Boolean(
        (payload.query && payload.query.length > 0) ||
          payload.categoryId ||
          payload.locationId ||
          typeof payload.priceMin === "number" ||
          typeof payload.priceMax === "number"
      ),
    { message: "At least one search filter is required." }
  )
  .refine(
    (payload) =>
      typeof payload.priceMin !== "number" ||
      typeof payload.priceMax !== "number" ||
      payload.priceMin <= payload.priceMax,
    { message: "priceMin must be less than or equal to priceMax." }
  );

export type SavedSearchCreatePayload = z.infer<typeof SavedSearchCreateSchema>;
