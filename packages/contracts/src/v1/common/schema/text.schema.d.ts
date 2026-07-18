/**
 * Centralized Text Field Schemas
 * Use these schemas instead of plain z.string() to get automatic validation
 *
 */
import { z } from 'zod';
/**
 * Creates a validated text schema with centralized content checks
 * Automatically validates against banned words, gibberish, and quality issues
 */
export declare const validatedTextSchema: (options?: {
    fieldName?: string;
    allowEmpty?: boolean;
    minLength?: number;
    maxLength?: number;
}) => z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Used for: Ad titles
 */
export declare const titleSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Used for: Service titles, Business names
 */
export declare const titleExtendedSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Used for: Ad descriptions
 */
export declare const descriptionSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Used for: Service descriptions, Business descriptions
 */
export declare const descriptionExtendedSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Used for: Comments, messages, reviews
 */
export declare const shortTextSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Used for: User names, display names
 */
export declare const nameSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 */
export declare const businessNameSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 */
export declare const searchQuerySchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 */
export declare const addressSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
/**
 * Optional validated text - allows empty/undefined
 */
export declare const optionalTextSchema: (options?: {
    fieldName?: string;
    minLength?: number;
    maxLength?: number;
}) => z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
export type ValidatedTitle = z.infer<typeof titleSchema>;
export type ValidatedTitleExtended = z.infer<typeof titleExtendedSchema>;
export type ValidatedDescription = z.infer<typeof descriptionSchema>;
export type ValidatedDescriptionExtended = z.infer<typeof descriptionExtendedSchema>;
export type ValidatedShortText = z.infer<typeof shortTextSchema>;
export type ValidatedName = z.infer<typeof nameSchema>;
export type ValidatedBusinessName = z.infer<typeof businessNameSchema>;
