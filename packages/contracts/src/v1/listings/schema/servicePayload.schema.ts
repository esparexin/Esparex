import { z } from 'zod';
import { PRICE_LIMITS, SERVICE_LIMITS, TEXT_LIMITS } from '../../common/constants/fieldLimits';
import { validatedTextSchema } from '../../common/schema/text.schema';
import { objectIdSchema as ObjectIdSchema } from '../../common/schema/common.schemas';

const serviceTypeField = {
    serviceTypeIds: z.array(ObjectIdSchema)
        .min(SERVICE_LIMITS.SERVICE_TYPES.MIN, SERVICE_LIMITS.SERVICE_TYPES.ERROR_MIN)
        .max(SERVICE_LIMITS.SERVICE_TYPES.MAX, SERVICE_LIMITS.SERVICE_TYPES.ERROR_MAX)
        .optional()
} as const;

/**
 * Base shape shared by both create and partial-update schemas.
 * All text fields use validatedTextSchema to ensure profanity/gibberish
 * detection runs on both CREATE (POST) and UPDATE (PATCH) operations.
 *
 * Cross-field refinements (price range, serviceType required) are applied
 * only on the full ServicePayloadSchema since they are not meaningful for
 * partial PATCH payloads where fields may be absent.
 */
const servicePayloadShape = {
    // Uses centralized text validation (bans profanity, gibberish, etc.)
    // Length bounds owned by TEXT_LIMITS (audit E2).
    title: validatedTextSchema({
        fieldName: 'Title',
        minLength: TEXT_LIMITS.TITLE_EXTENDED.MIN,
        maxLength: TEXT_LIMITS.TITLE_EXTENDED.MAX,
        }),

    deviceType: z.string()
        .max(50, 'Device type must be less than 50 characters')
        .optional(),

    categoryId: ObjectIdSchema,
    brandId: z.union([ObjectIdSchema, z.literal('')]).optional(),
    modelId: z.union([ObjectIdSchema, z.literal('')]).optional(),

    priceMin: z.number()
        .min(0, 'Minimum price must be at least 0')
        .max(PRICE_LIMITS.MAX, PRICE_LIMITS.ERROR_MAX)
        .optional(),

    // Uses centralized text validation (bans profanity, gibberish, etc.)
    // Length bounds owned by TEXT_LIMITS (audit E2).
    description: validatedTextSchema({
        fieldName: 'Description',
        minLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MIN,
        maxLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MAX,
        }),

    images: z.array(z.string())
        .min(1, 'At least one image is required')
        .max(SERVICE_LIMITS.IMAGES.MAX, SERVICE_LIMITS.IMAGES.ERROR_MAX),

    ...serviceTypeField
};

const rejectLegacyServiceTypesAlias = (data: unknown, ctx: z.RefinementCtx) => {
    if (Object.prototype.hasOwnProperty.call(data, 'serviceTypes')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['serviceTypes'],
            message: 'serviceTypes is no longer supported; use serviceTypeIds instead',
        });
    }
};

const withLegacyServiceTypeAliasGuard = <T extends z.ZodTypeAny>(schema: T) =>
    schema.superRefine(rejectLegacyServiceTypesAlias);

/**
 * Base Service Schema (unrefined)
 * Exported for extension in frontend to avoid ZodEffects .extend() issues.
 */
export const BaseServicePayloadSchema = z.object(servicePayloadShape)
    .passthrough();

/**
 * Service Payload Schema — used for CREATE (POST) operations.
 * Includes cross-field refinements: price range consistency and
 * at-least-one serviceType enforcement.
 */
export const ServicePayloadSchema = withLegacyServiceTypeAliasGuard(BaseServicePayloadSchema)
    .refine((data) => {
        return Boolean(Array.isArray(data.serviceTypeIds) && data.serviceTypeIds.length > 0);
    }, {
        message: 'At least one service type is required',
        path: ['serviceTypeIds']
    });

/**
 * Partial Service Payload Schema — used for PATCH/UPDATE operations.
 *
 * Built from the same base shape as ServicePayloadSchema so that field-level
 * validatedTextSchema checks (profanity/gibberish detection, min/max lengths)
 * are preserved on every PATCH request.
 *
 * Cross-field refinements (price range, serviceType required) are intentionally
 * omitted because a partial update may only send one of the two fields.
 */
export const PartialServicePayloadSchema = withLegacyServiceTypeAliasGuard(
    z.object(servicePayloadShape)
        .passthrough()
        .partial()
);

/**
 * Type exports
 */
export type ServicePayload = z.infer<typeof ServicePayloadSchema>;
export type PartialServicePayload = z.infer<typeof PartialServicePayloadSchema>;

/**
 * Frontend Form Schema for Service Listings (SSOT)
 * Consumed by user UI forms (PostServiceForm, etc.).
 * Guarantees schema contract compliance with empty-string optional handling.
 */
export const ServiceListingPayloadSchema = BaseServicePayloadSchema
    .omit({
        categoryId: true,
        brandId: true,
        modelId: true,
        serviceTypeIds: true,
        priceMin: true,
    })
    .merge(z.object({
        categoryId: z.string().min(1, 'Required'),
        brandId: z.union([ObjectIdSchema, z.literal('')]).optional(),
        modelId: z.union([ObjectIdSchema, z.literal('')]).optional(),
        serviceTypeIds: z.array(z.string()).min(1, 'Select at least one service type'),
        price: z.number({ message: 'Enter a valid price' })
            .min(PRICE_LIMITS.MIN, PRICE_LIMITS.ERROR_MIN)
            .max(PRICE_LIMITS.MAX, PRICE_LIMITS.ERROR_MAX),
    }));

export type ServiceListingFormData = z.infer<typeof ServiceListingPayloadSchema>;
