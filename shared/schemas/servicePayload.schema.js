"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialServicePayloadSchema = exports.ServicePayloadSchema = exports.BaseServicePayloadSchema = void 0;
const zod_1 = require("zod");
const text_schema_1 = require("./text.schema");
const catalog_schema_1 = require("./catalog.schema");
const serviceTypeField = {
    serviceTypeIds: zod_1.z.array(catalog_schema_1.ObjectIdSchema)
        .min(1, 'At least one service type is required')
        .max(20, 'Maximum 20 service types allowed')
        .optional()
};
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
    title: (0, text_schema_1.validatedTextSchema)({
        fieldName: 'Title',
        minLength: 10,
        maxLength: 100,
        strictMode: true,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),
    deviceType: zod_1.z.string()
        .max(50, 'Device type must be less than 50 characters')
        .optional(),
    categoryId: catalog_schema_1.ObjectIdSchema,
    brandId: catalog_schema_1.ObjectIdSchema.optional(),
    modelId: catalog_schema_1.ObjectIdSchema.optional(),
    priceMin: zod_1.z.number()
        .min(0, 'Minimum price must be at least 0')
        .max(10_000_000, 'Price cannot exceed ₹1 crore')
        .optional(),
    // Uses centralized text validation (bans profanity, gibberish, etc.)
    description: (0, text_schema_1.validatedTextSchema)({
        fieldName: 'Description',
        minLength: 20,
        maxLength: 2000,
        strictMode: false,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),
    images: zod_1.z.array(zod_1.z.string())
        .min(1, 'At least one image is required')
        .max(10, 'Maximum 10 images allowed'),
    ...serviceTypeField
};
const rejectLegacyServiceTypesAlias = (data, ctx) => {
    if (Object.prototype.hasOwnProperty.call(data, 'serviceTypes')) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['serviceTypes'],
            message: 'serviceTypes is no longer supported; use serviceTypeIds instead',
        });
    }
};
const withLegacyServiceTypeAliasGuard = (schema) => schema.superRefine(rejectLegacyServiceTypesAlias);
/**
 * Base Service Schema (unrefined)
 * Exported for extension in frontend to avoid ZodEffects .extend() issues.
 */
exports.BaseServicePayloadSchema = zod_1.z.object(servicePayloadShape)
    .passthrough();
/**
 * Service Payload Schema — used for CREATE (POST) operations.
 * Includes cross-field refinements: price range consistency and
 * at-least-one serviceType enforcement.
 */
exports.ServicePayloadSchema = withLegacyServiceTypeAliasGuard(exports.BaseServicePayloadSchema)
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
exports.PartialServicePayloadSchema = withLegacyServiceTypeAliasGuard(zod_1.z.object(servicePayloadShape)
    .passthrough()
    .partial());
//# sourceMappingURL=servicePayload.schema.js.map