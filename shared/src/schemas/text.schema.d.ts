/**
 * Centralized Text Field Schemas
 * Use these schemas instead of plain z.string() to get automatic validation
 *
 * IMPORTANT: All limits are sourced from /shared/constants/fieldLimits.ts
 */
import { z } from 'zod';
import { type TextValidationOptions } from '../utils/textValidator';
/**
 * Creates a validated text schema with centralized content checks
 * Automatically validates against banned words, gibberish, and quality issues
 */
export declare const validatedTextSchema: (options?: TextValidationOptions & {
    fieldName?: string;
}) => z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Title field schema - strict validation (uses TEXT_LIMITS.TITLE)
 * Used for: Ad titles
 */
export declare const titleSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Extended title schema (uses TEXT_LIMITS.TITLE_EXTENDED)
 * Used for: Service titles, Business names
 */
export declare const titleExtendedSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Description field schema (uses TEXT_LIMITS.DESCRIPTION)
 * Used for: Ad descriptions
 */
export declare const descriptionSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Extended description schema (uses TEXT_LIMITS.DESCRIPTION_EXTENDED)
 * Used for: Service descriptions, Business descriptions
 */
export declare const descriptionExtendedSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Short text schema (uses TEXT_LIMITS.SHORT_TEXT)
 * Used for: Comments, messages, reviews
 */
export declare const shortTextSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Name field schema (uses TEXT_LIMITS.NAME)
 * Used for: User names, display names
 */
export declare const nameSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Business name schema (uses TEXT_LIMITS.BUSINESS_NAME)
 */
export declare const businessNameSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Search query schema (uses TEXT_LIMITS.SEARCH_QUERY)
 */
export declare const searchQuerySchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Address field schema (uses TEXT_LIMITS.ADDRESS)
 */
export declare const addressSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Optional validated text - allows empty/undefined
 */
export declare const optionalTextSchema: (options?: TextValidationOptions & {
    fieldName?: string;
}) => z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
export type ValidatedTitle = z.infer<typeof titleSchema>;
export type ValidatedTitleExtended = z.infer<typeof titleExtendedSchema>;
export type ValidatedDescription = z.infer<typeof descriptionSchema>;
export type ValidatedDescriptionExtended = z.infer<typeof descriptionExtendedSchema>;
export type ValidatedShortText = z.infer<typeof shortTextSchema>;
export type ValidatedName = z.infer<typeof nameSchema>;
export type ValidatedBusinessName = z.infer<typeof businessNameSchema>;
//# sourceMappingURL=text.schema.d.ts.map