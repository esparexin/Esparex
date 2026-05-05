import { z } from 'zod';
import { coordinatesSchema } from './coordinates.schema';
export { coordinatesSchema } from './coordinates.schema';

// Re-export field limits constants (SINGLE SOURCE OF TRUTH)
export {
    TEXT_LIMITS,
    CONTACT_LIMITS,
    BUSINESS_LIMITS,
    AD_LIMITS,
    SERVICE_LIMITS,
    PAGINATION_LIMITS,
    COORDINATE_LIMITS,
    type TextLimitKey,
    type ContactLimitKey,
    type BusinessLimitKey
} from '../constants/fieldLimits';

// Re-export centralized text validation schemas
export {
    validatedTextSchema,
    titleSchema,
    titleExtendedSchema,
    descriptionSchema,
    descriptionExtendedSchema,
    shortTextSchema,
    nameSchema,
    businessNameSchema,
    searchQuerySchema,
    addressSchema,
    optionalTextSchema,
    type ValidatedTitle,
    type ValidatedTitleExtended,
    type ValidatedDescription,
    type ValidatedDescriptionExtended,
    type ValidatedShortText,
    type ValidatedName,
    type ValidatedBusinessName
} from './text.schema';

// Re-export text validator utilities for direct use
export {
    validateText,
    isTextValid,
    getValidationError,
    type TextValidationResult,
    type TextValidationIssue,
    type TextValidationOptions
} from '../utils/textValidator';

// Re-export banned words for content filtering
export {
    BANNED_WORDS,
    ALL_BANNED_WORDS,
    GIBBERISH_PATTERNS,
    TEXT_QUALITY_RULES,
    HARD_REJECT_CATEGORIES,
    MODERATION_CATEGORIES,
    type BannedCategory
} from '../constants/bannedWords';

/**
 * Common validation schemas for code reuse
 * Reduces duplication across validators
 */

// ObjectId validation
export const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

// Phone number validation
export const phoneSchema = z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .transform((val) => val.replace(/\s+/g, '')) // Remove whitespace
    .refine(
        (val) => val.replace(/\D/g, '').length >= 10,
        'Phone number must contain at least 10 digits'
    );

// Email validation
export const emailSchema = z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase();

// URL validation (optional)
export const urlSchema = z.string()
    .url('Invalid URL format')
    .max(2048, 'URL must be less than 2048 characters')
    .optional();

// Image URL array validation
export const imageArraySchema = (min: number = 1, max: number = 10) =>
    z.array(z.string().url('Invalid image URL'))
        .min(min, `At least ${min} image(s) required`)
        .max(max, `Maximum ${max} images allowed`);

// Price validation
export const priceSchema = z.number()
    .min(0, 'Price must be at least 0')
    .max(10000000, 'Price cannot exceed ₹1 crore');

// Price range validation (with refinement)
export const priceRangeSchema = z.object({
    minPrice: priceSchema.optional(),
    maxPrice: priceSchema.optional()
}).refine((data) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice;
    }
    return true;
}, {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['maxPrice']
});

// Date range validation
export const dateRangeSchema = z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional()
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate']
});

// Pagination schemas
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Sort schema
export const sortQuerySchema = z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc', '1', '-1']).optional().default('desc')
});

// Location schema (nested object)
export const locationSchema = z.object({
    address: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required').default('Unknown'),
    pincode: z.string().min(4).max(10).optional(),
    coordinates: coordinatesSchema.optional(),
    locationId: objectIdSchema.optional()
});

// Status enum (common across entities)
export const statusSchema = z.enum([
    'active',
    'inactive',
    'pending',
    'approved',
    'rejected',
    'expired',
    'sold'
]);

// Type exports for reuse
export type ObjectId = z.infer<typeof objectIdSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type Email = z.infer<typeof emailSchema>;
export type PriceRange = z.infer<typeof priceRangeSchema>;
export type Location = z.infer<typeof locationSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortQuery = z.infer<typeof sortQuerySchema>;
export type Status = z.infer<typeof statusSchema>;
