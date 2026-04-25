import { z } from 'zod';
import { coordinatesSchema } from './coordinates.schema';
export { coordinatesSchema } from './coordinates.schema';
export { TEXT_LIMITS, CONTACT_LIMITS, BUSINESS_LIMITS, AD_LIMITS, SERVICE_LIMITS, PAGINATION_LIMITS, COORDINATE_LIMITS, type TextLimitKey, type ContactLimitKey, type BusinessLimitKey } from '../constants/fieldLimits';
export { validatedTextSchema, titleSchema, titleExtendedSchema, descriptionSchema, descriptionExtendedSchema, shortTextSchema, nameSchema, businessNameSchema, searchQuerySchema, addressSchema, optionalTextSchema, type ValidatedTitle, type ValidatedTitleExtended, type ValidatedDescription, type ValidatedDescriptionExtended, type ValidatedShortText, type ValidatedName, type ValidatedBusinessName } from './text.schema';
export { validateText, isTextValid, getValidationError, type TextValidationResult, type TextValidationIssue, type TextValidationOptions } from '../utils/textValidator';
export { BANNED_WORDS, ALL_BANNED_WORDS, GIBBERISH_PATTERNS, TEXT_QUALITY_RULES, HARD_REJECT_CATEGORIES, MODERATION_CATEGORIES, type BannedCategory } from '../constants/bannedWords';
/**
 * Common validation schemas for code reuse
 * Reduces duplication across validators
 */
export declare const objectIdSchema: z.ZodString;
export declare const phoneSchema: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
export declare const emailSchema: z.ZodString;
export declare const urlSchema: z.ZodOptional<z.ZodString>;
export declare const imageArraySchema: (min?: number, max?: number) => z.ZodArray<z.ZodString>;
export declare const priceSchema: z.ZodNumber;
export declare const priceRangeSchema: z.ZodObject<{
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const dateRangeSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const sortQuerySchema: z.ZodObject<{
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        1: "1";
        asc: "asc";
        desc: "desc";
        [-1]: "-1";
    }>>>;
}, z.core.$strip>;
export declare const locationSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, z.core.$strip>>;
    locationId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const statusSchema: z.ZodEnum<{
    pending: "pending";
    rejected: "rejected";
    expired: "expired";
    sold: "sold";
    inactive: "inactive";
    active: "active";
    approved: "approved";
}>;
export type ObjectId = z.infer<typeof objectIdSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type Email = z.infer<typeof emailSchema>;
export type PriceRange = z.infer<typeof priceRangeSchema>;
export type Location = z.infer<typeof locationSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortQuery = z.infer<typeof sortQuerySchema>;
export type Status = z.infer<typeof statusSchema>;
