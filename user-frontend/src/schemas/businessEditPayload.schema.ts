import { z } from "zod";
import { createBusinessEditSchema } from "./business.schema.shared";

export const businessEditSchema = createBusinessEditSchema();

export type BusinessEditFormData = z.infer<typeof businessEditSchema>;
export type BusinessEditFormInput = z.input<typeof businessEditSchema>;
