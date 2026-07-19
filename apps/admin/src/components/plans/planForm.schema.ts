import { z } from "zod";
import { BasePlanPayloadSchema } from "@esparex/contracts";

const planShape = BasePlanPayloadSchema.shape;

// limits, features, smartAlertConfig are optional schemas in shared. Unwrap them safely.
const limitsSchema = planShape.limits instanceof z.ZodOptional ? planShape.limits.unwrap() : planShape.limits;
const limitsShape = limitsSchema.shape;

const featuresSchema = planShape.features instanceof z.ZodOptional ? planShape.features.unwrap() : planShape.features;
const featuresShape = featuresSchema.shape;

const smartAlertConfigSchema = planShape.smartAlertConfig instanceof z.ZodOptional ? planShape.smartAlertConfig.unwrap() : planShape.smartAlertConfig;
const smartAlertConfigShape = smartAlertConfigSchema.shape;

const unwrapOptional = <T extends z.ZodTypeAny>(schema: z.ZodOptional<T> | T): T => {
    return schema instanceof z.ZodOptional ? (schema.unwrap() as T) : (schema as T);
};

export const planFormSchema = z.object({
    code: planShape.code,
    name: planShape.name,
    description: planShape.description,
    type: planShape.type,
    userType: planShape.userType,
    price: planShape.price,
    currency: z.string().min(1, "Currency is required"),
    durationDays: unwrapOptional(planShape.durationDays).finite("Enter a valid number").int().min(0),
    isDefault: z.boolean(),
    active: z.boolean(),
    maxAds: unwrapOptional(limitsShape.maxAds).int().min(0),
    maxServices: unwrapOptional(limitsShape.maxServices).int().min(0),
    maxParts: unwrapOptional(limitsShape.maxParts).int().min(0),
    spotlightCredits: unwrapOptional(limitsShape.spotlightCredits).int().min(0),
    smartAlerts: unwrapOptional(limitsShape.smartAlerts).int().min(0),
    matchFrequency: smartAlertConfigShape.matchFrequency,
    radiusLimitKm: unwrapOptional(smartAlertConfigShape.radiusLimitKm).int().min(1, "Radius must be at least 1 km"),
    notificationChannels: smartAlertConfigShape.notificationChannels,
    priorityWeight: unwrapOptional(featuresShape.priorityWeight).int().min(1, "Min 1").max(10, "Max 10"),
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
