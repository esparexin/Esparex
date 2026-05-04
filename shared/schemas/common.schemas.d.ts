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
export declare const phoneSchema: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
export declare const emailSchema: z.ZodString;
export declare const urlSchema: z.ZodOptional<z.ZodString>;
export declare const imageArraySchema: (min?: number, max?: number) => z.ZodArray<z.ZodString, "many">;
export declare const priceSchema: z.ZodNumber;
export declare const priceRangeSchema: z.ZodEffects<z.ZodObject<{
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}, {
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}>, {
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}, {
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}>;
export declare const dateRangeSchema: z.ZodEffects<z.ZodObject<{
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}, {
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}>, {
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}, {
    startDate?: Date | undefined;
    endDate?: Date | undefined;
}>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const sortQuerySchema: z.ZodObject<{
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc", "1", "-1"]>>>;
}, "strip", z.ZodTypeAny, {
    sortOrder: "1" | "asc" | "desc" | "-1";
    sortBy?: string | undefined;
}, {
    sortBy?: string | undefined;
    sortOrder?: "1" | "asc" | "desc" | "-1" | undefined;
}>;
export declare const locationSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    locationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    country: string;
    state: string;
    city: string;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    address?: string | undefined;
    pincode?: string | undefined;
    locationId?: string | undefined;
}, {
    state: string;
    city: string;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    country?: string | undefined;
    address?: string | undefined;
    pincode?: string | undefined;
    locationId?: string | undefined;
}>;
export declare const statusSchema: z.ZodEnum<["active", "inactive", "pending", "approved", "rejected", "expired", "sold"]>;
export type ObjectId = z.infer<typeof objectIdSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type Email = z.infer<typeof emailSchema>;
export type PriceRange = z.infer<typeof priceRangeSchema>;
export type Location = z.infer<typeof locationSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortQuery = z.infer<typeof sortQuerySchema>;
export type Status = z.infer<typeof statusSchema>;
//# sourceMappingURL=common.schemas.d.ts.map