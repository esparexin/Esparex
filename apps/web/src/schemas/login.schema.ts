import * as z from "zod";
import { authMobileSchema, authNameSchema } from "@esparex/contracts";

export const loginFormSchema = z.object({
  mobile: authMobileSchema,
  name: z.union([authNameSchema, z.literal("")]).optional(),
  otp: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
