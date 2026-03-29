import { z } from "zod";

import { MOBILE_VISIBILITY } from "@shared/constants/mobileVisibility";

import { DELETE_ACCOUNT_REASONS } from "@/components/user/profile/types";

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

export const profileFormSchema = z.object({
  name: z.preprocess(
    trimString,
    z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name must be 50 characters or fewer.")
  ),
  email: optionalTrimmedString(
    z.string().email("Please enter a valid email address.")
  ),
  businessName: optionalTrimmedString(
    z.string().max(100, "Business name must be 100 characters or fewer.")
  ),
  gstNumber: optionalTrimmedString(
    z.string().max(20, "GST number must be 20 characters or fewer.")
  ),
  mobileVisibility: z.enum([
    MOBILE_VISIBILITY.SHOW,
    MOBILE_VISIBILITY.HIDE,
  ]),
});

export const deleteAccountFormSchema = z.object({
  reason: z.enum(DELETE_ACCOUNT_REASONS),
  feedback: optionalTrimmedString(
    z.string().max(500, "Feedback must be 500 characters or fewer.")
  ),
  confirmText: z.preprocess(
    trimString,
    z
      .string()
      .min(1, "Type delete to confirm.")
      .refine((value) => value.toLowerCase() === "delete", "Type delete to confirm.")
  ),
});

export type ProfileSettingsFormValues = z.infer<typeof profileFormSchema>;
export type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>;
