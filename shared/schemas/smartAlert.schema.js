"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAlertDeliveryLogSchema = exports.SmartAlertUpdateSchema = exports.SmartAlertCreateSchema = void 0;
const zod_1 = require("zod");
const common_schemas_1 = require("./common.schemas");
const coordinates_schema_1 = require("./coordinates.schema");
const optionalTrimmedString = zod_1.z.preprocess((value) => {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}, zod_1.z.string().optional());
const frequencySchema = zod_1.z.enum(['daily', 'instant']);
const notificationChannelSchema = zod_1.z.enum(['email', 'sms', 'push']);
const smartAlertCriteriaSchema = zod_1.z
    .object({
    keywords: optionalTrimmedString,
    category: optionalTrimmedString,
    brand: optionalTrimmedString,
    model: optionalTrimmedString,
    categoryId: common_schemas_1.objectIdSchema.optional(),
    brandId: common_schemas_1.objectIdSchema.optional(),
    modelId: common_schemas_1.objectIdSchema.optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    condition: optionalTrimmedString,
    location: optionalTrimmedString,
    locationId: common_schemas_1.objectIdSchema.optional(),
    state: optionalTrimmedString,
    coordinates: coordinates_schema_1.coordinatesSchema.optional(),
})
    .superRefine((data, ctx) => {
    if (typeof data.minPrice === 'number' &&
        typeof data.maxPrice === 'number' &&
        data.maxPrice < data.minPrice) {
        ctx.addIssue({
            path: ['maxPrice'],
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Maximum price must be greater than minimum price',
        });
    }
});
const smartAlertBodySchema = zod_1.z
    .object({
    alertName: optionalTrimmedString,
    name: optionalTrimmedString,
    criteria: smartAlertCriteriaSchema.optional(),
    frequency: frequencySchema.optional(),
    coordinates: coordinates_schema_1.coordinatesSchema.optional(),
    radiusKm: zod_1.z.coerce.number().min(1).max(500).optional(),
    notificationChannels: zod_1.z.array(notificationChannelSchema).min(1).max(3).optional(),
})
    .strict();
const normalizeSmartAlertBody = (data, options) => {
    const normalizedName = data.name ?? data.alertName;
    const { alertName: _alertName, ...rest } = data;
    return {
        ...rest,
        name: normalizedName,
        ...(options.applyFrequencyDefault ? { frequency: data.frequency ?? 'instant' } : {}),
    };
};
exports.SmartAlertCreateSchema = smartAlertBodySchema
    .superRefine((data, ctx) => {
    const candidateName = data.name ?? data.alertName;
    if (!candidateName) {
        ctx.addIssue({
            path: ['name'],
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Alert name is required',
        });
        return;
    }
    if (candidateName.length < 3 || candidateName.length > 50) {
        ctx.addIssue({
            path: ['name'],
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Alert name must be between 3 and 50 characters',
        });
    }
    if (!data.criteria || typeof data.criteria !== 'object') {
        ctx.addIssue({
            path: ['criteria'],
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Alert criteria is required',
        });
    }
})
    .transform((data) => normalizeSmartAlertBody(data, { applyFrequencyDefault: true }));
exports.SmartAlertUpdateSchema = smartAlertBodySchema
    .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
        ctx.addIssue({
            path: ['_root'],
            code: zod_1.z.ZodIssueCode.custom,
            message: 'At least one field is required to update alert',
        });
        return;
    }
    const candidateName = data.name ?? data.alertName;
    if (candidateName && (candidateName.length < 3 || candidateName.length > 50)) {
        ctx.addIssue({
            path: ['name'],
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Alert name must be between 3 and 50 characters',
        });
    }
})
    .transform((data) => normalizeSmartAlertBody(data, { applyFrequencyDefault: false }));
exports.SmartAlertDeliveryLogSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    alertId: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            _id: zod_1.z.string(),
            name: zod_1.z.string(),
            criteria: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
            user: zod_1.z.string().optional()
        })
    ]),
    adId: zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            _id: zod_1.z.string(),
            title: zod_1.z.string(),
            price: zod_1.z.number(),
            location: zod_1.z.string().optional(),
            status: zod_1.z.string()
        })
    ]),
    deliveredAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    userName: zod_1.z.string().optional(),
    userEmail: zod_1.z.string().optional(),
    adTitle: zod_1.z.string().optional()
});
//# sourceMappingURL=smartAlert.schema.js.map