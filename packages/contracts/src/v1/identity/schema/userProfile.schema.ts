import { z } from "zod";

export const DELETE_ACCOUNT_REASONS = [
  "not_useful",
  "privacy_concerns",
  "too_many_emails",
  "found_alternative",
  "other",
] as const;

export type DeleteAccountReason = (typeof DELETE_ACCOUNT_REASONS)[number];

export const personalProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .refine((val) => /^[\p{L}\p{N}\s.\-'_,]+$/u.test(val.trim()), "Name contains invalid characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .optional()
    .or(z.literal('')),
  businessName: z
    .string()
    .max(120, "Business name cannot exceed 120 characters")
    .optional()
    .or(z.literal('')),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Please enter a valid 15-character GSTIN")
    .optional()
    .or(z.literal('')),
  mobileVisibility: z.enum(['show', 'hide', 'on_request']),
  photo: z.string().optional(),
});

export type PersonalProfileValues = z.infer<typeof personalProfileSchema>;

export const notificationSettingsSchema = z.object({
  enabled: z.boolean(),
  instantAlerts: z.boolean().optional(),
});

export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

export const deleteAccountFormSchema = z.object({
  reason: z.enum(DELETE_ACCOUNT_REASONS),
  feedback: z
    .string()
    .max(500, "Feedback must be 500 characters or fewer.")
    .optional(),
  confirmText: z
    .string()
    .min(1, "Type delete to confirm.")
    .refine((value) => value.trim().toLowerCase() === "delete", "Type delete to confirm."),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>;
