import { z } from 'zod';
import { TEXT_LIMITS } from '../constants/fieldLimits';

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

export const titleSchema = validatedTextSchema({
    fieldName: 'Title',
    minLength: TEXT_LIMITS.TITLE.MIN,
    maxLength: TEXT_LIMITS.TITLE.MAX,
});
export const titleExtendedSchema = validatedTextSchema({
    fieldName: 'Title',
    minLength: TEXT_LIMITS.TITLE_EXTENDED.MIN,
    maxLength: TEXT_LIMITS.TITLE_EXTENDED.MAX,
});
export const descriptionSchema = validatedTextSchema({
    fieldName: 'Description',
    minLength: TEXT_LIMITS.DESCRIPTION.MIN,
    maxLength: TEXT_LIMITS.DESCRIPTION.MAX,
});
export const descriptionExtendedSchema = validatedTextSchema({
    fieldName: 'Description',
    minLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MIN,
    maxLength: TEXT_LIMITS.DESCRIPTION_EXTENDED.MAX,
});
export const shortTextSchema = validatedTextSchema({
    fieldName: 'Text',
    minLength: TEXT_LIMITS.SHORT_TEXT.MIN,
    maxLength: TEXT_LIMITS.SHORT_TEXT.MAX,
});
export const nameSchema = validatedTextSchema({
    fieldName: 'Name',
    minLength: TEXT_LIMITS.NAME.MIN,
    maxLength: TEXT_LIMITS.NAME.MAX,
});
export const businessNameSchema = validatedTextSchema({
    fieldName: 'Business Name',
    minLength: TEXT_LIMITS.BUSINESS_NAME.MIN,
    maxLength: TEXT_LIMITS.BUSINESS_NAME.MAX,
});
export const searchQuerySchema = validatedTextSchema({
    fieldName: 'Search',
    minLength: TEXT_LIMITS.SEARCH_QUERY.MIN,
    maxLength: TEXT_LIMITS.SEARCH_QUERY.MAX,
    allowEmpty: true,
});
export const addressSchema = validatedTextSchema({
    fieldName: 'Address',
    minLength: TEXT_LIMITS.ADDRESS.MIN,
    maxLength: TEXT_LIMITS.ADDRESS.MAX,
});

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
