/**
 * Plan Payload Schema — shared validation for admin plan create/update API.
 *
 * This schema validates the NESTED payload shape that the admin frontend sends
 * (after formToPayload() transforms flat form values).  It is the canonical
 * contract between the admin UI and the plan CRUD controllers.
 *
 * Plan model structure is mirrored here:
 *   limits.{ maxAds, maxServices, maxParts, smartAlerts, spotlightCredits }
 *   features.{ priorityWeight, businessBadge, canEditAd, showOnHomePage }
 *   smartAlertConfig.{ maxAlerts, matchFrequency, radiusLimitKm, notificationChannels }
 */
import { z } from 'zod';

const limitsSchema = z.object({
    maxAds: z.number().int().min(0).optional(),
    maxServices: z.number().int().min(0).optional(),
    maxParts: z.number().int().min(0).optional(),
    smartAlerts: z.number().int().min(0).optional(),
    spotlightCredits: z.number().int().min(0).optional(),
}).optional();

const featuresSchema = z.object({
    priorityWeight: z.number().int().min(1).max(10).optional(),
    businessBadge: z.boolean().optional(),
    canEditAd: z.boolean().optional(),
    showOnHomePage: z.boolean().optional(),
}).optional();

const smartAlertConfigSchema = z.object({
    maxAlerts: z.number().int().min(0),
    matchFrequency: z.enum(['instant', 'hourly', 'daily']),
    radiusLimitKm: z.number().int().min(1),
    notificationChannels: z.array(z.string()).min(1, 'Select at least one notification channel'),
}).optional();

export const BasePlanPayloadSchema = z.object({
    code: z.string().min(1, 'Plan code is required').max(50, 'Code too long'),
    name: z.string().min(1, 'Plan name is required').max(100, 'Name too long'),
    description: z.string().max(300, 'Description too long').optional(),
    type: z.enum(['AD_PACK', 'SPOTLIGHT', 'SMART_ALERT']),
    userType: z.enum(['normal', 'business', 'both']),
    price: z.number().min(0, 'Price cannot be negative'),
    currency: z.string().default('INR'),
    durationDays: z.number().int().min(0).optional(),
    isDefault: z.boolean().optional(),
    active: z.boolean().optional(),
    limits: limitsSchema,
    features: featuresSchema,
    smartAlertConfig: smartAlertConfigSchema,
});

/** Full create schema */
export const PlanPayloadSchema = BasePlanPayloadSchema;

/** Partial update schema */
export const PartialPlanPayloadSchema = BasePlanPayloadSchema.partial();

export type PlanPayload = z.infer<typeof PlanPayloadSchema>;
export type PartialPlanPayload = z.infer<typeof PartialPlanPayloadSchema>;
