import { z } from "zod";
import { BasePlanPayloadSchema } from "@esparex/contracts";

const planShape = BasePlanPayloadSchema.shape;

export const planFormSchema = z.object({
    code: planShape.code,
    name: planShape.name,
    description: planShape.description,
    type: planShape.type,
    userType: planShape.userType,
    price: planShape.price,
    currency: z.string().min(1, "Currency is required"),
    durationDays: z.number({ invalid_type_error: "Validity must be a number" }).int("Validity must be an integer").min(0, "Validity cannot be negative"),
    isDefault: z.boolean(),
    active: z.boolean(),
    maxAds: z.number({ invalid_type_error: "Ad Slots must be a number" }).int().min(0),
    maxServices: z.number({ invalid_type_error: "Max Services must be a number" }).int().min(0),
    maxParts: z.number({ invalid_type_error: "Max Parts must be a number" }).int().min(0),
    spotlightCredits: z.number({ invalid_type_error: "Spotlight Credits must be a number" }).int().min(0),
    smartAlerts: z.number({ invalid_type_error: "Alert Slots must be a number" }).int().min(0),
    matchFrequency: z.enum(['instant', 'hourly', 'daily']),
    radiusLimitKm: z.number({ invalid_type_error: "Radius must be a number" }).int().min(0),
    notificationChannels: z.array(z.string()),
    priorityWeight: z.number({ invalid_type_error: "Priority Weight must be a number" }).int().min(1).max(10),
    businessBadge: z.boolean(),
    canEditAd: z.boolean(),
    showOnHomePage: z.boolean(),
}).superRefine((data, ctx) => {
    // 1. Non-Free plans must have a positive duration (at least 1 day)
    if (data.type !== "FREE_DEFAULT" && data.durationDays < 1) {
        ctx.addIssue({
            path: ["durationDays"],
            code: z.ZodIssueCode.custom,
            message: "Validity must be at least 1 day for non-default plans",
        });
    }

    // 2. FREE_DEFAULT plan must have price = 0
    if (data.type === "FREE_DEFAULT" && data.price > 0) {
        ctx.addIssue({
            path: ["price"],
            code: z.ZodIssueCode.custom,
            message: "Free Plan price must be ₹0",
        });
    }

    // 3. Paid non-Free plans should have a non-negative price
    if (data.type !== "FREE_DEFAULT" && data.price < 0) {
        ctx.addIssue({
            path: ["price"],
            code: z.ZodIssueCode.custom,
            message: "Price cannot be negative",
        });
    }

    // 4. FREE_DEFAULT and AD_PACK require maxAds >= 1
    if ((data.type === "FREE_DEFAULT" || data.type === "AD_PACK") && (data.maxAds === undefined || data.maxAds < 1)) {
        ctx.addIssue({
            path: ["maxAds"],
            code: z.ZodIssueCode.custom,
            message: data.type === "FREE_DEFAULT" ? "Monthly free ad slots must be at least 1" : "Ad posting credits must be at least 1",
        });
    }

    // 5. SPOTLIGHT requires spotlightCredits >= 1 and priorityWeight 1..10
    if (data.type === "SPOTLIGHT") {
        if (data.spotlightCredits === undefined || data.spotlightCredits < 1) {
            ctx.addIssue({
                path: ["spotlightCredits"],
                code: z.ZodIssueCode.custom,
                message: "Spotlight Credits must be at least 1",
            });
        }
        if (data.priorityWeight === undefined || data.priorityWeight < 1 || data.priorityWeight > 10) {
            ctx.addIssue({
                path: ["priorityWeight"],
                code: z.ZodIssueCode.custom,
                message: "Priority Weight must be between 1 and 10",
            });
        }
    }

    // 6. BOOST_AD requires priorityWeight 1..10
    if (data.type === "BOOST_AD") {
        if (data.priorityWeight === undefined || data.priorityWeight < 1 || data.priorityWeight > 10) {
            ctx.addIssue({
                path: ["priorityWeight"],
                code: z.ZodIssueCode.custom,
                message: "Priority Weight must be between 1 and 10",
            });
        }
    }

    // 7. SMART_ALERT conditional validations
    if (data.type === "SMART_ALERT") {
        if (data.smartAlerts === undefined || data.smartAlerts < 1) {
            ctx.addIssue({
                path: ["smartAlerts"],
                code: z.ZodIssueCode.custom,
                message: "Alert Slots must be at least 1",
            });
        }
        if (data.radiusLimitKm === undefined || data.radiusLimitKm < 1) {
            ctx.addIssue({
                path: ["radiusLimitKm"],
                code: z.ZodIssueCode.custom,
                message: "Radius Limit must be at least 1 km",
            });
        }
        if (!data.notificationChannels || data.notificationChannels.length === 0) {
            ctx.addIssue({
                path: ["notificationChannels"],
                code: z.ZodIssueCode.custom,
                message: "Select at least one notification channel",
            });
        }
    }
});

export type PlanFormValues = z.infer<typeof planFormSchema>;
