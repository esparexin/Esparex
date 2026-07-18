/**
 * Centralized Text Field Schemas
 */
import { z } from 'zod';

/**
 * Creates a validated text schema with trim transform and optional length validation.
 */
export const validatedTextSchema = (options: {
    fieldName?: string;
    allowEmpty?: boolean;
    minLength?: number;
    maxLength?: number;
} = {}) => {
    let schema: z.ZodString = z.string();

    if (options.minLength !== undefined) {
        schema = schema.min(options.minLength, `${options.fieldName || 'Text'} must be at least ${options.minLength} characters`);
    }
    if (options.maxLength !== undefined) {
        schema = schema.max(options.maxLength, `${options.fieldName || 'Text'} must be at most ${options.maxLength} characters`);
    }

    return schema.transform(val => val.trim()).superRefine((val, ctx) => {
        if (!options.allowEmpty && !val && options.minLength !== 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${options.fieldName || 'Text'} cannot be empty`
            });
        }
    });
};

export const titleSchema = validatedTextSchema({ fieldName: 'Title' });
export const titleExtendedSchema = validatedTextSchema({ fieldName: 'Title' });
export const descriptionSchema = validatedTextSchema({ fieldName: 'Description' });
export const descriptionExtendedSchema = validatedTextSchema({ fieldName: 'Description' });
export const shortTextSchema = validatedTextSchema({ fieldName: 'Text' });
export const nameSchema = validatedTextSchema({ fieldName: 'Name' });
export const businessNameSchema = validatedTextSchema({ fieldName: 'Business Name' });
export const searchQuerySchema = validatedTextSchema({ fieldName: 'Search', allowEmpty: true });
export const addressSchema = validatedTextSchema({ fieldName: 'Address' });

export const optionalTextSchema = (options: { fieldName?: string; minLength?: number; maxLength?: number } = {}) => {
    return validatedTextSchema({ ...options, allowEmpty: true }).optional();
};

export type ValidatedTitle = z.infer<typeof titleSchema>;
export type ValidatedTitleExtended = z.infer<typeof titleExtendedSchema>;
export type ValidatedDescription = z.infer<typeof descriptionSchema>;
export type ValidatedDescriptionExtended = z.infer<typeof descriptionExtendedSchema>;
export type ValidatedShortText = z.infer<typeof shortTextSchema>;
export type ValidatedName = z.infer<typeof nameSchema>;
export type ValidatedBusinessName = z.infer<typeof businessNameSchema>;
