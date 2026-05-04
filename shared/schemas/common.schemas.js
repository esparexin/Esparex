"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusSchema = exports.locationSchema = exports.sortQuerySchema = exports.paginationQuerySchema = exports.dateRangeSchema = exports.priceRangeSchema = exports.priceSchema = exports.imageArraySchema = exports.urlSchema = exports.emailSchema = exports.phoneSchema = exports.objectIdSchema = exports.MODERATION_CATEGORIES = exports.HARD_REJECT_CATEGORIES = exports.TEXT_QUALITY_RULES = exports.GIBBERISH_PATTERNS = exports.ALL_BANNED_WORDS = exports.BANNED_WORDS = exports.getValidationError = exports.isTextValid = exports.validateText = exports.optionalTextSchema = exports.addressSchema = exports.searchQuerySchema = exports.businessNameSchema = exports.nameSchema = exports.shortTextSchema = exports.descriptionExtendedSchema = exports.descriptionSchema = exports.titleExtendedSchema = exports.titleSchema = exports.validatedTextSchema = exports.COORDINATE_LIMITS = exports.PAGINATION_LIMITS = exports.SERVICE_LIMITS = exports.AD_LIMITS = exports.BUSINESS_LIMITS = exports.CONTACT_LIMITS = exports.TEXT_LIMITS = exports.coordinatesSchema = void 0;
const zod_1 = require("zod");
const coordinates_schema_1 = require("./coordinates.schema");
var coordinates_schema_2 = require("./coordinates.schema");
Object.defineProperty(exports, "coordinatesSchema", { enumerable: true, get: function () { return coordinates_schema_2.coordinatesSchema; } });
// Re-export field limits constants (SINGLE SOURCE OF TRUTH)
var fieldLimits_1 = require("../constants/fieldLimits");
Object.defineProperty(exports, "TEXT_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.TEXT_LIMITS; } });
Object.defineProperty(exports, "CONTACT_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.CONTACT_LIMITS; } });
Object.defineProperty(exports, "BUSINESS_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.BUSINESS_LIMITS; } });
Object.defineProperty(exports, "AD_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.AD_LIMITS; } });
Object.defineProperty(exports, "SERVICE_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.SERVICE_LIMITS; } });
Object.defineProperty(exports, "PAGINATION_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.PAGINATION_LIMITS; } });
Object.defineProperty(exports, "COORDINATE_LIMITS", { enumerable: true, get: function () { return fieldLimits_1.COORDINATE_LIMITS; } });
// Re-export centralized text validation schemas
var text_schema_1 = require("./text.schema");
Object.defineProperty(exports, "validatedTextSchema", { enumerable: true, get: function () { return text_schema_1.validatedTextSchema; } });
Object.defineProperty(exports, "titleSchema", { enumerable: true, get: function () { return text_schema_1.titleSchema; } });
Object.defineProperty(exports, "titleExtendedSchema", { enumerable: true, get: function () { return text_schema_1.titleExtendedSchema; } });
Object.defineProperty(exports, "descriptionSchema", { enumerable: true, get: function () { return text_schema_1.descriptionSchema; } });
Object.defineProperty(exports, "descriptionExtendedSchema", { enumerable: true, get: function () { return text_schema_1.descriptionExtendedSchema; } });
Object.defineProperty(exports, "shortTextSchema", { enumerable: true, get: function () { return text_schema_1.shortTextSchema; } });
Object.defineProperty(exports, "nameSchema", { enumerable: true, get: function () { return text_schema_1.nameSchema; } });
Object.defineProperty(exports, "businessNameSchema", { enumerable: true, get: function () { return text_schema_1.businessNameSchema; } });
Object.defineProperty(exports, "searchQuerySchema", { enumerable: true, get: function () { return text_schema_1.searchQuerySchema; } });
Object.defineProperty(exports, "addressSchema", { enumerable: true, get: function () { return text_schema_1.addressSchema; } });
Object.defineProperty(exports, "optionalTextSchema", { enumerable: true, get: function () { return text_schema_1.optionalTextSchema; } });
// Re-export text validator utilities for direct use
var textValidator_1 = require("../utils/textValidator");
Object.defineProperty(exports, "validateText", { enumerable: true, get: function () { return textValidator_1.validateText; } });
Object.defineProperty(exports, "isTextValid", { enumerable: true, get: function () { return textValidator_1.isTextValid; } });
Object.defineProperty(exports, "getValidationError", { enumerable: true, get: function () { return textValidator_1.getValidationError; } });
// Re-export banned words for content filtering
var bannedWords_1 = require("../constants/bannedWords");
Object.defineProperty(exports, "BANNED_WORDS", { enumerable: true, get: function () { return bannedWords_1.BANNED_WORDS; } });
Object.defineProperty(exports, "ALL_BANNED_WORDS", { enumerable: true, get: function () { return bannedWords_1.ALL_BANNED_WORDS; } });
Object.defineProperty(exports, "GIBBERISH_PATTERNS", { enumerable: true, get: function () { return bannedWords_1.GIBBERISH_PATTERNS; } });
Object.defineProperty(exports, "TEXT_QUALITY_RULES", { enumerable: true, get: function () { return bannedWords_1.TEXT_QUALITY_RULES; } });
Object.defineProperty(exports, "HARD_REJECT_CATEGORIES", { enumerable: true, get: function () { return bannedWords_1.HARD_REJECT_CATEGORIES; } });
Object.defineProperty(exports, "MODERATION_CATEGORIES", { enumerable: true, get: function () { return bannedWords_1.MODERATION_CATEGORIES; } });
/**
 * Common validation schemas for code reuse
 * Reduces duplication across validators
 */
// ObjectId validation
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');
// Phone number validation
exports.phoneSchema = zod_1.z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .transform((val) => val.replace(/\s+/g, '')) // Remove whitespace
    .refine((val) => val.replace(/\D/g, '').length >= 10, 'Phone number must contain at least 10 digits');
// Email validation
exports.emailSchema = zod_1.z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase();
// URL validation (optional)
exports.urlSchema = zod_1.z.string()
    .url('Invalid URL format')
    .max(2048, 'URL must be less than 2048 characters')
    .optional();
// Image URL array validation
const imageArraySchema = (min = 1, max = 10) => zod_1.z.array(zod_1.z.string().url('Invalid image URL'))
    .min(min, `At least ${min} image(s) required`)
    .max(max, `Maximum ${max} images allowed`);
exports.imageArraySchema = imageArraySchema;
// Price validation
exports.priceSchema = zod_1.z.number()
    .min(0, 'Price must be at least 0')
    .max(10000000, 'Price cannot exceed ₹1 crore');
// Price range validation (with refinement)
exports.priceRangeSchema = zod_1.z.object({
    minPrice: exports.priceSchema.optional(),
    maxPrice: exports.priceSchema.optional()
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
exports.dateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional()
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
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20)
});
// Sort schema
exports.sortQuerySchema = zod_1.z.object({
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc', '1', '-1']).optional().default('desc')
});
// Location schema (nested object)
exports.locationSchema = zod_1.z.object({
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().min(1, 'State is required'),
    country: zod_1.z.string().min(1, 'Country is required').default('Unknown'),
    pincode: zod_1.z.string().min(4).max(10).optional(),
    coordinates: coordinates_schema_1.coordinatesSchema.optional(),
    locationId: exports.objectIdSchema.optional()
});
// Status enum (common across entities)
exports.statusSchema = zod_1.z.enum([
    'active',
    'inactive',
    'pending',
    'approved',
    'rejected',
    'expired',
    'sold'
]);
//# sourceMappingURL=common.schemas.js.map