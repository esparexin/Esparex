"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBusinessUpdateSchema = exports.adminBusinessStatusSchema = exports.adminBusinessRejectSchema = exports.adminBusinessAccountsQuerySchema = exports.publicBusinessQuerySchema = exports.updateBusinessSchema = exports.createBusinessSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const phoneUtils_1 = require("@core/utils/phoneUtils");
const common_schemas_1 = require("@shared/schemas/common.schemas");
const textValidator_1 = require("@shared/utils/textValidator");
const idProofType_1 = require("@core/constants/enums/idProofType");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
const DEFAULT_BUSINESS_TYPES = ['Repair services', 'Spare parts'];
const FULL_ADDRESS_PINCODE_PATTERN = /\b\d{6}\b/;
const LEGACY_BUSINESS_CITY_ALIAS_MESSAGE = '`city` is no longer accepted in business query filters. Use `locationId` or coordinates instead.';
const LEGACY_BUSINESS_CATEGORY_ALIAS_MESSAGE = '`category` is no longer accepted in business query filters. Use `listingCategoryId` instead.';
const LEGACY_BUSINESS_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin business filters. Use `q` instead.';
const LEGACY_BUSINESS_CITY_ADMIN_ALIAS_MESSAGE = '`city` is no longer accepted in admin business filters. Use `locationId` instead.';
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
const rejectLegacyBusinessQueryAliases = (raw, aliases) => {
    const issues = aliases
        .filter(({ alias }) => hasOwn(raw, alias))
        .map(({ alias, message }) => ({
        code: zod_1.z.ZodIssueCode.custom,
        path: [alias],
        message,
    }));
    if (issues.length === 0)
        return;
    throw new zod_1.z.ZodError(issues);
};
// VALIDATION SSOT NOTE:
// This schema mirrors shared/schemas/coordinates.schema.ts.
// Direct import avoided due to Zod instance boundary across monorepo packages.
// Behavior matches the canonical SSOT (lng-first, isFinite, bounds-checked).
// --- v3-native schemas (avoid cross-package Zod version mixing) ---
/**
 * Mobile number schema — normalizes any format (+91, 91, dashes) → 10-digit Indian mobile.
 * Aligns with auth.validator.ts SSOT (normalizeTo10Digits from phoneUtils).
 */
const phoneSchema = zod_1.z.string()
    .transform(phoneUtils_1.normalizeTo10Digits)
    .refine((val) => /^[6-9]\d{9}$/.test(val), 'Invalid mobile number (must be a 10-digit Indian mobile starting with 6–9)');
/**
 * Business name schema — v3 native with shared text content validation.
 */
const businessNameSchema = zod_1.z.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be 100 characters or fewer')
    .transform((val) => val.trim())
    .superRefine((val, ctx) => {
    const result = (0, textValidator_1.validateText)(val, { checkBannedWords: true, checkGibberish: true, strictMode: true });
    if (result.action === 'reject') {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: result.issues[0]?.message || 'Business name contains prohibited content' });
    }
});
/**
 * Description schema — v3 native with shared text content validation.
 */
const descriptionSchema = zod_1.z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer')
    .transform((val) => val.trim())
    .superRefine((val, ctx) => {
    const result = (0, textValidator_1.validateText)(val, { checkBannedWords: true, checkGibberish: true, strictMode: false });
    if (result.action === 'reject') {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: result.issues[0]?.message || 'Description contains prohibited content' });
    }
});
/**
 * GeoJSON Point coordinates schema — mirrors shared/schemas/coordinates.schema.ts.
 * Cannot import directly due to Zod singleton boundary across monorepo packages.
 * Behavior is canonical: lng-first, bounds-checked, Number.isFinite, null-island rejected.
 */
const coordinatesSchema = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: zod_1.z.tuple([
        zod_1.z.number().min(-180).max(180).refine(Number.isFinite, 'Longitude must be a finite number'),
        zod_1.z.number().min(-90).max(90).refine(Number.isFinite, 'Latitude must be a finite number')
    ]).refine(([lng, lat]) => !(lng === 0 && lat === 0), 'Coordinates [0,0] are not allowed')
});
const optionalTrimmedString = (max) => zod_1.z
    .string()
    .max(max)
    .transform((value) => value.trim());
const locationSchema = zod_1.z.object({
    locationId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID').optional(),
    address: zod_1.z.string()
        .trim()
        .min(15, 'Complete business address is required')
        .max(300, 'Business address must be 300 characters or fewer')
        .refine((value) => FULL_ADDRESS_PINCODE_PATTERN.test(value), 'Address must include a valid 6-digit pincode'),
    display: optionalTrimmedString(150).optional(),
    city: optionalTrimmedString(50).optional(),
    state: optionalTrimmedString(50).optional(),
    country: optionalTrimmedString(50).optional(),
    pincode: zod_1.z.union([
        zod_1.z.string().regex(common_schemas_1.BUSINESS_LIMITS.PINCODE.PATTERN, common_schemas_1.BUSINESS_LIMITS.PINCODE.ERROR_FORMAT),
        zod_1.z.literal(''),
    ]).optional(),
    coordinates: coordinatesSchema,
});
const documentsSchema = zod_1.z.object({
    idProofType: zod_1.z.enum(idProofType_1.ID_PROOF_TYPE_VALUES, {
        required_error: 'ID proof type is required',
        invalid_type_error: 'Invalid ID proof type'
    }),
    idProof: zod_1.z.array(zod_1.z.string()).min(1, 'ID proof is required'),
    businessProof: zod_1.z.array(zod_1.z.string()).min(1, 'Business proof is required'),
    certificates: zod_1.z.array(zod_1.z.string()).optional()
});
const businessBaseShape = {
    // Uses centralized text validation (profanity, gibberish detection)
    name: businessNameSchema,
    description: descriptionSchema.optional(),
    businessTypes: zod_1.z.array((0, common_1.sanitizeString)(2, 50)).min(1, 'Select at least one business type').optional(),
    location: locationSchema,
    // Canonical contact field for business mutations
    mobile: phoneSchema.optional(),
    email: common_1.commonSchemas.email,
    website: zod_1.z.string().url().optional(),
    gstNumber: zod_1.z.string().regex(common_schemas_1.BUSINESS_LIMITS.GST.PATTERN, common_schemas_1.BUSINESS_LIMITS.GST.ERROR_FORMAT).optional(),
    registrationNumber: (0, common_1.sanitizeString)(common_schemas_1.BUSINESS_LIMITS.REGISTRATION.MIN, common_schemas_1.BUSINESS_LIMITS.REGISTRATION.MAX).optional(),
    workingHours: zod_1.z.unknown().optional(),
    images: zod_1.z.array(zod_1.z.string()).min(common_schemas_1.BUSINESS_LIMITS.IMAGES.MIN, common_schemas_1.BUSINESS_LIMITS.IMAGES.ERROR_MIN).max(common_schemas_1.BUSINESS_LIMITS.IMAGES.MAX, common_schemas_1.BUSINESS_LIMITS.IMAGES.ERROR_MAX),
    documents: documentsSchema
};
exports.createBusinessSchema = zod_1.z.object(businessBaseShape).strict()
    .transform((data) => {
    if (!Array.isArray(data.businessTypes) || data.businessTypes.length === 0) {
        data.businessTypes = [...DEFAULT_BUSINESS_TYPES];
    }
    return data;
})
    .refine((data) => !!data.mobile, {
    message: "Mobile number is required",
    path: ["mobile"]
});
exports.updateBusinessSchema = zod_1.z.object(businessBaseShape).partial().extend({
    location: locationSchema.partial().optional(),
    documents: documentsSchema.partial().optional(),
    images: zod_1.z.array(zod_1.z.string()).max(common_schemas_1.BUSINESS_LIMITS.IMAGES.MAX, common_schemas_1.BUSINESS_LIMITS.IMAGES.ERROR_MAX).optional(),
    businessTypes: zod_1.z.array((0, common_1.sanitizeString)(2, 50)).min(1, 'Select at least one business type').optional(),
}).strict();
const publicBusinessQuerySchemaBase = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
    latitude: zod_1.z.coerce.number().min(-90).max(90).optional(),
    longitude: zod_1.z.coerce.number().min(-180).max(180).optional(),
    radiusKm: zod_1.z.coerce.number().min(1).max(100).optional(),
    locationId: common_1.commonSchemas.objectId.optional(),
    listingCategoryId: common_1.commonSchemas.objectId.optional(),
    brandId: common_1.commonSchemas.objectId.optional(),
    excludeBusinessId: common_1.commonSchemas.objectId.optional(),
    serviceOnly: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
exports.publicBusinessQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyBusinessQueryAliases(raw, [
        { alias: 'city', message: LEGACY_BUSINESS_CITY_ALIAS_MESSAGE },
        { alias: 'category', message: LEGACY_BUSINESS_CATEGORY_ALIAS_MESSAGE },
    ]);
    return raw;
}, publicBusinessQuerySchemaBase);
const adminBusinessStatusFilterSchema = zod_1.z.enum([
    businessStatus_1.BUSINESS_STATUS.LIVE,
    businessStatus_1.BUSINESS_STATUS.PENDING,
    businessStatus_1.BUSINESS_STATUS.REJECTED,
    businessStatus_1.BUSINESS_STATUS.SUSPENDED,
    businessStatus_1.BUSINESS_STATUS.DELETED,
    'all',
    'approved',
    'active',
]);
const adminBusinessAccountsQuerySchemaBase = zod_1.z.object({
    status: adminBusinessStatusFilterSchema.optional(),
    q: zod_1.z.string().trim().max(200).optional(),
    locationId: common_1.commonSchemas.objectId.optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    includeDeleted: zod_1.z.enum(['true', 'false']).optional(),
    sort: zod_1.z.string().trim().max(100).optional(),
}).strict();
exports.adminBusinessAccountsQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyBusinessQueryAliases(raw, [
        { alias: 'search', message: LEGACY_BUSINESS_SEARCH_ALIAS_MESSAGE },
        { alias: 'city', message: LEGACY_BUSINESS_CITY_ADMIN_ALIAS_MESSAGE },
    ]);
    return raw;
}, adminBusinessAccountsQuerySchemaBase);
exports.adminBusinessRejectSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(10, 'Rejection reason is required').max(500),
}).strict();
exports.adminBusinessStatusSchema = zod_1.z
    .object({
    status: zod_1.z.enum([
        businessStatus_1.BUSINESS_STATUS.LIVE,
        businessStatus_1.BUSINESS_STATUS.REJECTED,
        businessStatus_1.BUSINESS_STATUS.SUSPENDED,
        'approved',
        'active',
    ]),
    reason: zod_1.z.string().trim().max(500).optional(),
})
    .strict()
    .superRefine((data, ctx) => {
    const normalizedStatus = data.status.toLowerCase();
    if ((normalizedStatus === businessStatus_1.BUSINESS_STATUS.REJECTED || normalizedStatus === businessStatus_1.BUSINESS_STATUS.SUSPENDED) && !data.reason) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['reason'],
            message: 'Reason is required for rejection or suspension',
        });
    }
});
exports.adminBusinessUpdateSchema = zod_1.z.object({
    name: businessNameSchema.optional(),
    description: zod_1.z.string().trim().max(2000).optional(),
    mobile: phoneSchema.optional(),
    email: zod_1.z.union([common_1.commonSchemas.email, zod_1.z.literal('')]).optional(),
    website: zod_1.z.union([zod_1.z.string().url('Invalid URL format'), zod_1.z.literal('')]).optional(),
    gstNumber: zod_1.z.union([
        zod_1.z.string().regex(common_schemas_1.BUSINESS_LIMITS.GST.PATTERN, common_schemas_1.BUSINESS_LIMITS.GST.ERROR_FORMAT),
        zod_1.z.literal(''),
    ]).optional(),
    registrationNumber: zod_1.z.union([
        (0, common_1.sanitizeString)(common_schemas_1.BUSINESS_LIMITS.REGISTRATION.MIN, common_schemas_1.BUSINESS_LIMITS.REGISTRATION.MAX),
        zod_1.z.literal(''),
    ]).optional(),
    businessTypes: zod_1.z.array((0, common_1.sanitizeString)(2, 50)).min(1, 'Select at least one business type').optional(),
    location: zod_1.z.object({
        locationId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID').optional(),
        address: optionalTrimmedString(200).optional(),
        shopNo: optionalTrimmedString(50).optional(),
        street: optionalTrimmedString(100).optional(),
        landmark: optionalTrimmedString(100).optional(),
        city: optionalTrimmedString(50).optional(),
        state: optionalTrimmedString(50).optional(),
        pincode: zod_1.z.union([
            zod_1.z.string().regex(common_schemas_1.BUSINESS_LIMITS.PINCODE.PATTERN, common_schemas_1.BUSINESS_LIMITS.PINCODE.ERROR_FORMAT),
            zod_1.z.literal(''),
        ]).optional(),
        coordinates: coordinatesSchema.optional(),
    }).strict().optional(),
}).strict();
//# sourceMappingURL=business.validator.js.map