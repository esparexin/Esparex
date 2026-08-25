import * as z from "zod";

export const loginFormSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit mobile number"),
  name: z.string()
    .regex(/^[a-zA-Z\s'.-]*$/, "Name can only contain letters, spaces, dots, hyphens, and apostrophes")
    .refine((val) => !val || val.trim().length >= 2, { message: "Name must be at least 2 characters" })
    .optional(),
  otp: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
