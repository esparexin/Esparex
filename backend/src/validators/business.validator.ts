import { z } from 'zod';
import { commonSchemas, sanitizeString } from '../middleware/validateRequest';
import { BUSINESS_LIMITS } from '../../../shared/schemas/common.schemas';
import { validateText } from '../../../shared/utils/textValidator';
import { ID_PROOF_TYPE_VALUES } from '../../../shared/enums/idProofType';

// VALIDATION SSOT NOTE:
// This schema mirrors shared/schemas/coordinates.schema.ts.
// Direct import avoided due to Zod instance boundary across monorepo packages.
// Behavior matches the canonical SSOT (lng-first, isFinite, bounds-checked).
// --- v3-native schemas (avoid cross-package Zod version mixing) ---

/**
 * Phone number schema — v3 native.
 * Strips whitespace, ensures at least 10 digits.
 */
const phoneSchema = z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => val.replace(/\D/g, '').length >= 10, 'Phone number must contain at least 10 digits');

/**
 * Business name schema — v3 native with shared text content validation.
 */
const businessNameSchema = z.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be 100 characters or fewer')
    .transform((val) => val.trim())
    .superRefine((val, ctx) => {
        const result = validateText(val, { checkBannedWords: true, checkGibberish: true, strictMode: true });
        if (result.action === 'reject') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.issues[0]?.message || 'Business name contains prohibited content' });
        }
    });

/**
 * Description schema — v3 native with shared text content validation.
 */
const descriptionSchema = z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer')
    .transform((val) => val.trim())
    .superRefine((val, ctx) => {
        const result = validateText(val, { checkBannedWords: true, checkGibberish: true, strictMode: false });
        if (result.action === 'reject') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.issues[0]?.message || 'Description contains prohibited content' });
        }
    });

/**
 * GeoJSON Point coordinates schema — mirrors shared/schemas/coordinates.schema.ts.
 * Cannot import directly due to Zod singleton boundary across monorepo packages.
 * Behavior is canonical: lng-first, bounds-checked, Number.isFinite, null-island rejected.
 */
const coordinatesSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
        z.number().min(-180).max(180).refine(Number.isFinite, 'Longitude must be a finite number'),
        z.number().min(-90).max(90).refine(Number.isFinite, 'Latitude must be a finite number')
    ]).refine(([lng, lat]) => !(lng === 0 && lat === 0), 'Coordinates [0,0] are not allowed')
});

const locationSchema = z.object({
    shopNo: sanitizeString(1, 50),
    street: sanitizeString(2, 100),
    landmark: sanitizeString(0, 100).optional(),
    city: sanitizeString(2, 50),
    state: sanitizeString(2, 50),
    pincode: z.string().regex(BUSINESS_LIMITS.PINCODE.PATTERN, BUSINESS_LIMITS.PINCODE.ERROR_FORMAT),
    coordinates: coordinatesSchema.optional()
});

const documentsSchema = z.object({
    idProofType: z.enum(ID_PROOF_TYPE_VALUES, {
        required_error: 'ID proof type is required',
        invalid_type_error: 'Invalid ID proof type'
    }),
    idProof: z.array(z.string()).min(1, 'ID proof is required'),
    businessProof: z.array(z.string()).min(1, 'Business proof is required'),
    certificates: z.array(z.string()).optional()
});

const businessBaseShape = {
    // Uses centralized text validation (profanity, gibberish detection)
    name: businessNameSchema,
    description: descriptionSchema.optional(),
    businessTypes: z.array(sanitizeString(2, 50)).min(1, 'Select at least one business type'),
    location: locationSchema,
    // Support phone OR mobile - uses shared phoneSchema
    mobile: phoneSchema.optional(),
    phone: phoneSchema.optional(),
    email: commonSchemas.email,
    website: z.string().url().optional(),
    gstNumber: z.string().regex(BUSINESS_LIMITS.GST.PATTERN, BUSINESS_LIMITS.GST.ERROR_FORMAT).optional(),
    registrationNumber: sanitizeString(
        BUSINESS_LIMITS.REGISTRATION.MIN, 
        BUSINESS_LIMITS.REGISTRATION.MAX
    ).optional(),
    workingHours: z.unknown().optional(),
    images: z.array(z.string()).min(BUSINESS_LIMITS.IMAGES.MIN, BUSINESS_LIMITS.IMAGES.ERROR_MIN).max(BUSINESS_LIMITS.IMAGES.MAX, BUSINESS_LIMITS.IMAGES.ERROR_MAX),
    documents: documentsSchema
};

export const createBusinessSchema = z.object(businessBaseShape).strict().transform((data) => {
    if (data.phone && !data.mobile) {
        data.mobile = data.phone;
    }
    return data;
}).refine((data) => !!data.mobile, {
    message: "Phone number (mobile) is required",
    path: ["mobile"]
});

export const updateBusinessSchema = z.object(businessBaseShape).partial().extend({
    location: locationSchema.partial().optional(),
    documents: documentsSchema.partial().optional(),
    images: z.array(z.string()).max(BUSINESS_LIMITS.IMAGES.MAX, BUSINESS_LIMITS.IMAGES.ERROR_MAX).optional()
}).strict();
