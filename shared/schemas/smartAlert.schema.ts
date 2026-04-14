import { z } from 'zod';
import { objectIdSchema } from './common.schemas';
import { coordinatesSchema } from './coordinates.schema';

const optionalTrimmedString = z.preprocess(
    (value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().optional()
);

const frequencySchema = z.enum(['daily', 'instant']);
const notificationChannelSchema = z.enum(['email', 'sms', 'push']);

const smartAlertCriteriaSchema = z
    .object({
        keywords: optionalTrimmedString,
        category: optionalTrimmedString,
        brand: optionalTrimmedString,
        model: optionalTrimmedString,
        categoryId: objectIdSchema.optional(),
        brandId: objectIdSchema.optional(),
        modelId: objectIdSchema.optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        condition: optionalTrimmedString,
        location: optionalTrimmedString,
        locationId: objectIdSchema.optional(),
        state: optionalTrimmedString,
        coordinates: coordinatesSchema.optional(),
    })
    .superRefine((data, ctx) => {
        if (
            typeof data.minPrice === 'number' &&
            typeof data.maxPrice === 'number' &&
            data.maxPrice < data.minPrice
        ) {
            ctx.addIssue({
                path: ['maxPrice'],
                code: z.ZodIssueCode.custom,
                message: 'Maximum price must be greater than minimum price',
            });
        }
    });

const smartAlertBodySchema = z
    .object({
        alertName: optionalTrimmedString,
        name: optionalTrimmedString,
        criteria: smartAlertCriteriaSchema.optional(),
        frequency: frequencySchema.optional(),
        coordinates: coordinatesSchema.optional(),
        radiusKm: z.coerce.number().min(1).max(500).optional(),
        notificationChannels: z.array(notificationChannelSchema).min(1).max(3).optional(),
    })
    .strict();

const normalizeSmartAlertBody = (
    data: z.infer<typeof smartAlertBodySchema>,
    options: { applyFrequencyDefault: boolean }
) => {
    const normalizedName = data.name ?? data.alertName;
    const { alertName: _alertName, ...rest } = data;
    return {
        ...rest,
        name: normalizedName,
        ...(options.applyFrequencyDefault ? { frequency: data.frequency ?? 'instant' } : {}),
    };
};

export const SmartAlertCreateSchema = smartAlertBodySchema
    .superRefine((data, ctx) => {
        const candidateName = data.name ?? data.alertName;
        if (!candidateName) {
            ctx.addIssue({
                path: ['name'],
                code: z.ZodIssueCode.custom,
                message: 'Alert name is required',
            });
            return;
        }
        if (candidateName.length < 3 || candidateName.length > 50) {
            ctx.addIssue({
                path: ['name'],
                code: z.ZodIssueCode.custom,
                message: 'Alert name must be between 3 and 50 characters',
            });
        }

        if (!data.criteria || typeof data.criteria !== 'object') {
            ctx.addIssue({
                path: ['criteria'],
                code: z.ZodIssueCode.custom,
                message: 'Alert criteria is required',
            });
        }
    })
    .transform((data) => normalizeSmartAlertBody(data, { applyFrequencyDefault: true }));

export const SmartAlertUpdateSchema = smartAlertBodySchema
    .superRefine((data, ctx) => {
        if (Object.keys(data).length === 0) {
            ctx.addIssue({
                path: ['_root'],
                code: z.ZodIssueCode.custom,
                message: 'At least one field is required to update alert',
            });
            return;
        }

        const candidateName = data.name ?? data.alertName;
        if (candidateName && (candidateName.length < 3 || candidateName.length > 50)) {
            ctx.addIssue({
                path: ['name'],
                code: z.ZodIssueCode.custom,
                message: 'Alert name must be between 3 and 50 characters',
            });
        }
    })
    .transform((data) => normalizeSmartAlertBody(data, { applyFrequencyDefault: false }));

export type SmartAlertCreatePayload = z.infer<typeof SmartAlertCreateSchema>;
export type SmartAlertUpdatePayload = z.infer<typeof SmartAlertUpdateSchema>;

export const SmartAlertDeliveryLogSchema = z.object({
    _id: z.string(),
    alertId: z.union([
        z.string(),
        z.object({
            _id: z.string(),
            name: z.string(),
            criteria: z.record(z.string(), z.any()),
            user: z.string().optional()
        })
    ]),
    adId: z.union([
        z.string(),
        z.object({
            _id: z.string(),
            title: z.string(),
            price: z.number(),
            location: z.string().optional(),
            status: z.string()
        })
    ]),
    deliveredAt: z.union([z.string(), z.date()]),
    userName: z.string().optional(),
    userEmail: z.string().optional(),
    adTitle: z.string().optional()
});

export type SmartAlertDeliveryLogDTO = z.infer<typeof SmartAlertDeliveryLogSchema>;
