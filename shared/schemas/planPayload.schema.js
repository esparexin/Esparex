"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialPlanPayloadSchema = exports.PlanPayloadSchema = exports.BasePlanPayloadSchema = void 0;
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
const zod_1 = require("zod");
const limitsSchema = zod_1.z.object({
    maxAds: zod_1.z.number().int().min(0).optional(),
    maxServices: zod_1.z.number().int().min(0).optional(),
    maxParts: zod_1.z.number().int().min(0).optional(),
    smartAlerts: zod_1.z.number().int().min(0).optional(),
    spotlightCredits: zod_1.z.number().int().min(0).optional(),
}).optional();
const featuresSchema = zod_1.z.object({
    priorityWeight: zod_1.z.number().int().min(1).max(10).optional(),
    businessBadge: zod_1.z.boolean().optional(),
    canEditAd: zod_1.z.boolean().optional(),
    showOnHomePage: zod_1.z.boolean().optional(),
}).optional();
const smartAlertConfigSchema = zod_1.z.object({
    maxAlerts: zod_1.z.number().int().min(0),
    matchFrequency: zod_1.z.enum(['instant', 'hourly', 'daily']),
    radiusLimitKm: zod_1.z.number().int().min(1),
    notificationChannels: zod_1.z.array(zod_1.z.string()).min(1, 'Select at least one notification channel'),
}).optional();
exports.BasePlanPayloadSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Plan code is required').max(50, 'Code too long'),
    name: zod_1.z.string().min(1, 'Plan name is required').max(100, 'Name too long'),
    description: zod_1.z.string().max(300, 'Description too long').optional(),
    type: zod_1.z.enum(['AD_PACK', 'SPOTLIGHT', 'SMART_ALERT']),
    userType: zod_1.z.enum(['normal', 'business', 'both']),
    price: zod_1.z.number().min(0, 'Price cannot be negative'),
    currency: zod_1.z.string().default('INR'),
    durationDays: zod_1.z.number().int().min(0).optional(),
    isDefault: zod_1.z.boolean().optional(),
    active: zod_1.z.boolean().optional(),
    limits: limitsSchema,
    features: featuresSchema,
    smartAlertConfig: smartAlertConfigSchema,
});
/** Full create schema */
exports.PlanPayloadSchema = exports.BasePlanPayloadSchema;
/** Partial update schema */
exports.PartialPlanPayloadSchema = exports.BasePlanPayloadSchema.partial();
//# sourceMappingURL=planPayload.schema.js.map