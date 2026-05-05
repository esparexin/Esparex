import { z } from "zod";
import { AdSchema as SharedAdSchema } from "@shared";

export const AdSchema = SharedAdSchema;
export type Ad = z.infer<typeof AdSchema>;
