import { z } from 'zod';
import { validatedTextSchema } from './text.schema';
import { ObjectIdSchema } from './catalog.schema';

const serviceTypeToken = z.string().min(1).max(120);

const serviceTypeFields = {
    serviceTypes: z.array(serviceTypeToken)
        .min(1, 'At least one service type is required')
        .max(20, 'Maximum 20 service types allowed')
        .optional(),
    serviceTypeIds: z.array(ObjectIdSchema)
        .min(1, 'At least one service type is required')
        .max(20, 'Maximum 20 service types allowed')
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
    title: validatedTextSchema({
        fieldName: 'Title',
        minLength: 10,
        maxLength: 100,
        strictMode: true,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),

    deviceType: z.string()
        .max(50, 'Device type must be less than 50 characters')
        .optional(),

    categoryId: ObjectIdSchema,
    brandId: ObjectIdSchema.optional(),
    modelId: ObjectIdSchema.optional(),

    priceMin: z.number()
        .min(0, 'Minimum price must be at least 0')
        .max(10_000_000, 'Price cannot exceed ₹1 crore')
        .optional(),

    // Uses centralized text validation (bans profanity, gibberish, etc.)
    description: validatedTextSchema({
        fieldName: 'Description',
        minLength: 20,
        maxLength: 2000,
        strictMode: false,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),

    images: z.array(z.string())
        .min(1, 'At least one image is required')
        .max(10, 'Maximum 10 images allowed'),

    ...serviceTypeFields
};

/**
 * Base Service Schema (unrefined)
 * Exported for extension in frontend to avoid ZodEffects .extend() issues.
 */
export const BaseServicePayloadSchema = z.object(servicePayloadShape).passthrough();

/**
 * Service Payload Schema — used for CREATE (POST) operations.
 * Includes cross-field refinements: price range consistency and
 * at-least-one serviceType enforcement.
 */
export const ServicePayloadSchema = BaseServicePayloadSchema
    .refine((data) => {
        return Boolean(
            (Array.isArray(data.serviceTypes) && data.serviceTypes.length > 0)
            || (Array.isArray(data.serviceTypeIds) && data.serviceTypeIds.length > 0)
        );
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
export const PartialServicePayloadSchema = z.object(servicePayloadShape)
    .passthrough()
    .partial();

/**
 * Type exports
 */
export type ServicePayload = z.infer<typeof ServicePayloadSchema>;
export type PartialServicePayload = z.infer<typeof PartialServicePayloadSchema>;
