import { z } from "zod";
import { createBusinessRegistrationSchema } from "./business.schema.shared";

export const businessRegistrationSchema = createBusinessRegistrationSchema();

export type BusinessRegistrationFormData = z.infer<typeof businessRegistrationSchema>;
export type BusinessRegistrationFormInput = z.input<typeof businessRegistrationSchema>;
