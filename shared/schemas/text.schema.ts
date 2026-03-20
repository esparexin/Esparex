/**
 * Centralized Text Field Schemas
 * Use these schemas instead of plain z.string() to get automatic validation
 * 
 * IMPORTANT: All limits are sourced from /shared/constants/fieldLimits.ts
 */

import { z } from 'zod';
import { validateText, getValidationError, type TextValidationOptions } from '../utils/textValidator';
import { TEXT_LIMITS } from '../constants/fieldLimits';

/**
 * Creates a validated text schema with centralized content checks
 * Automatically validates against banned words, gibberish, and quality issues
 */
export const validatedTextSchema = (options: TextValidationOptions & {
    fieldName?: string;
} = {}) => {
    const { fieldName = 'Text', ...validationOptions } = options;

    return z.string()
        .transform(val => val.trim())
        .superRefine((val, ctx) => {
            if (validationOptions.allowEmpty && !val) return;
            
            const result = validateText(val, validationOptions);
            
            if (result.action === 'reject') {
                let error = getValidationError(result);
                // Replace generic 'Text' with actual field name if possible
                if (error && error.includes('Text ')) {
                    error = error.replace('Text ', `${fieldName} `);
                }
                
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: error || `${fieldName} contains prohibited content`
                });
            }
        });
};

/**
 * Title field schema - strict validation (uses TEXT_LIMITS.TITLE)
 * Used for: Ad titles
 */
export const titleSchema = validatedTextSchema({
    fieldName: 'Title',
    minLength: TEXT_LIMITS.TITLE.MIN,
    maxLength: TEXT_LIMITS.TITLE.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});

/**
 * Extended title schema (uses TEXT_LIMITS.TITLE_EXTENDED)
 * Used for: Service titles, Business names
 */
export const titleExtendedSchema = validatedTextSchema({
    fieldName: 'Title',
    minLength: TEXT_LIMITS.TITLE_EXTENDED.MIN,
    maxLength: TEXT_LIMITS.TITLE_EXTENDED.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});

/**
 * Description field schema (uses TEXT_LIMITS.DESCRIPTION)
 * Used for: Ad descriptions
 */
export const descriptionSchema = validatedTextSchema({
    fieldName: 'Description',
    minLength: TEXT_LIMITS.DESCRIPTION.MIN,
    maxLength: TEXT_LIMITS.DESCRIPTION.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});

/**
 * Extended description schema (uses TEXT_LIMITS.DESCRIPTION_EXTENDED)
 * Used for: Service descriptions, Business descriptions
 */
export const descriptionExtendedSchema = validatedTextSchema({
    fieldName: 'Description',
    minLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MIN,
    maxLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});

/**
 * Short text schema (uses TEXT_LIMITS.SHORT_TEXT)
 * Used for: Comments, messages, reviews
 */
export const shortTextSchema = validatedTextSchema({
    fieldName: 'Text',
    minLength: TEXT_LIMITS.SHORT_TEXT.MIN,
    maxLength: TEXT_LIMITS.SHORT_TEXT.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});

/**
 * Name field schema (uses TEXT_LIMITS.NAME)
 * Used for: User names, display names
 */
export const nameSchema = validatedTextSchema({
    fieldName: 'Name',
    minLength: TEXT_LIMITS.NAME.MIN,
    maxLength: TEXT_LIMITS.NAME.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});

/**
 * Business name schema (uses TEXT_LIMITS.BUSINESS_NAME)
 */
export const businessNameSchema = validatedTextSchema({
    fieldName: 'Business Name',
    minLength: TEXT_LIMITS.BUSINESS_NAME.MIN,
    maxLength: TEXT_LIMITS.BUSINESS_NAME.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});

/**
 * Search query schema (uses TEXT_LIMITS.SEARCH_QUERY)
 */
export const searchQuerySchema = validatedTextSchema({
    fieldName: 'Search',
    allowEmpty: true,
    maxLength: TEXT_LIMITS.SEARCH_QUERY.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: false,
    checkQuality: false
});

/**
 * Address field schema (uses TEXT_LIMITS.ADDRESS)
 */
export const addressSchema = validatedTextSchema({
    fieldName: 'Address',
    minLength: TEXT_LIMITS.ADDRESS.MIN,
    maxLength: TEXT_LIMITS.ADDRESS.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});

/**
 * Optional validated text - allows empty/undefined
 */
export const optionalTextSchema = (options: TextValidationOptions & { fieldName?: string } = {}) => {
    return validatedTextSchema({ ...options, allowEmpty: true }).optional();
};

// Type exports
export type ValidatedTitle = z.infer<typeof titleSchema>;
export type ValidatedTitleExtended = z.infer<typeof titleExtendedSchema>;
export type ValidatedDescription = z.infer<typeof descriptionSchema>;
export type ValidatedDescriptionExtended = z.infer<typeof descriptionExtendedSchema>;
export type ValidatedShortText = z.infer<typeof shortTextSchema>;
export type ValidatedName = z.infer<typeof nameSchema>;
export type ValidatedBusinessName = z.infer<typeof businessNameSchema>;
