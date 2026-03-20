import { z } from "zod";
import { AdSchema as SharedAdSchema } from "@shared/schemas/ad.schema";

export const AdSchema = SharedAdSchema;
export type Ad = z.infer<typeof AdSchema>;
