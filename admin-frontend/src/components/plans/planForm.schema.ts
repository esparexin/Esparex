import { z } from "zod";

export const planFormSchema = z.object({
    code: z.string().min(1, "Plan code is required").max(50, "Code too long"),
    name: z.string().min(1, "Plan name is required").max(100, "Name too long"),
    description: z.string().max(300, "Description too long").optional(),
    type: z.enum(["AD_PACK", "SPOTLIGHT", "SMART_ALERT"]),
    userType: z.enum(["normal", "business", "both"]),
    price: z.number().finite("Enter a valid price").min(0, "Price cannot be negative"),
    currency: z.string().min(1, "Currency is required"),
    durationDays: z.number().finite("Enter a valid number").int().min(0),
    isDefault: z.boolean(),
    active: z.boolean(),
    maxAds: z.number().int().min(0),
    maxServices: z.number().int().min(0),
    maxParts: z.number().int().min(0),
    spotlightCredits: z.number().int().min(0),
    smartAlertSlots: z.number().int().min(0),
    matchFrequency: z.enum(["instant", "hourly", "daily"]),
    radiusLimitKm: z.number().int().min(1, "Radius must be at least 1 km"),
    notificationChannels: z.array(z.string()).min(1, "Select at least one notification channel"),
    priorityWeight: z.number().int().min(1, "Min 1").max(10, "Max 10"),
    businessBadge: z.boolean(),
    canEditAd: z.boolean(),
    showOnHomePage: z.boolean(),
}).superRefine((data, ctx) => {
    // Non-default plans must have a positive duration
    if (!data.isDefault && data.durationDays < 1) {
        ctx.addIssue({
            path: ["durationDays"],
            code: z.ZodIssueCode.custom,
            message: "Validity must be at least 1 day for non-default plans",
        });
    }
});

export type PlanFormValues = z.infer<typeof planFormSchema>;
