import { z } from 'zod';
/**
 * Base Service Schema (unrefined)
 * Exported for extension in frontend to avoid ZodEffects .extend() issues.
 */
export declare const BaseServicePayloadSchema: z.ZodObject<{
    serviceTypeIds: z.ZodOptional<z.ZodArray<any, "many">>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    deviceType: z.ZodOptional<z.ZodString>;
    categoryId: any;
    brandId: any;
    modelId: any;
    priceMin: z.ZodOptional<z.ZodNumber>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    images: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    serviceTypeIds: z.ZodOptional<z.ZodArray<any, "many">>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    deviceType: z.ZodOptional<z.ZodString>;
    categoryId: any;
    brandId: any;
    modelId: any;
    priceMin: z.ZodOptional<z.ZodNumber>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    images: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    serviceTypeIds: z.ZodOptional<z.ZodArray<any, "many">>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    deviceType: z.ZodOptional<z.ZodString>;
    categoryId: any;
    brandId: any;
    modelId: any;
    priceMin: z.ZodOptional<z.ZodNumber>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    images: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Service Payload Schema — used for CREATE (POST) operations.
 * Includes cross-field refinements: price range consistency and
 * at-least-one serviceType enforcement.
 */
export declare const ServicePayloadSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    serviceTypeIds: z.ZodOptional<z.ZodArray<any, "many">>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    deviceType: z.ZodOptional<z.ZodString>;
    categoryId: any;
    brandId: any;
    modelId: any;
    priceMin: z.ZodOptional<z.ZodNumber>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    images: z.ZodArray<z.ZodString, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    serviceTypeIds: z.ZodOptional<z.ZodArray<any, "many">>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    deviceType: z.ZodOptional<z.ZodString>;
    categoryId: any;
    brandId: any;
    modelId: any;
    priceMin: z.ZodOptional<z.ZodNumber>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    images: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    serviceTypeIds: z.ZodOptional<z.ZodArray<any, "many">>;
    title: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    deviceType: z.ZodOptional<z.ZodString>;
    categoryId: any;
    brandId: any;
    modelId: any;
    priceMin: z.ZodOptional<z.ZodNumber>;
    description: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    images: z.ZodArray<z.ZodString, "many">;
}, z.ZodTypeAny, "passthrough">>, any, any>, any, any>;
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
export declare const PartialServicePayloadSchema: z.ZodEffects<z.ZodObject<{
    serviceTypeIds: z.ZodOptional<z.ZodOptional<z.ZodArray<any, "many">>>;
    title: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    deviceType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<any>;
    brandId: z.ZodOptional<any>;
    modelId: z.ZodOptional<any>;
    priceMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    serviceTypeIds: z.ZodOptional<z.ZodOptional<z.ZodArray<any, "many">>>;
    title: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    deviceType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<any>;
    brandId: z.ZodOptional<any>;
    modelId: z.ZodOptional<any>;
    priceMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    serviceTypeIds: z.ZodOptional<z.ZodOptional<z.ZodArray<any, "many">>>;
    title: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    deviceType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<any>;
    brandId: z.ZodOptional<any>;
    modelId: z.ZodOptional<any>;
    priceMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>, any, any>;
/**
 * Type exports
 */
export type ServicePayload = z.infer<typeof ServicePayloadSchema>;
export type PartialServicePayload = z.infer<typeof PartialServicePayloadSchema>;
