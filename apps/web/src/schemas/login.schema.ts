import * as z from "zod";
import { authMobileSchema, authNameSchema } from "@esparex/contracts";

export const loginFormSchema = z.object({
  mobile: authMobileSchema,
  name: authNameSchema.optional(),
  otp: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
