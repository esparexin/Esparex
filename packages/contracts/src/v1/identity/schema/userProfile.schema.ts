import { z } from "zod";

export const personalProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
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
  instantAlerts: z.boolean(),
  adUpdates: z.boolean(),
  promotions: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
