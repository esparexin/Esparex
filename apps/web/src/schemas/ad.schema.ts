import { z } from "zod";
import { AdSchema as SharedAdSchema } from "@esparex/contracts";

export const AdSchema = SharedAdSchema;
export type Ad = z.infer<typeof AdSchema>;
