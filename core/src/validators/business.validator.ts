import { z } from 'zod';
import { commonSchemas, sanitizeString } from './common';
import {
    BUSINESS_LIMITS,
    BUSINESS_STATUS,
    CreateBusinessPayloadSchema,
    UpdateBusinessPayloadSchema,
    coordinatesSchema,
    businessPhoneSchema,
    businessNameSchema,
} from '@esparex/contracts';

const optionalTrimmedString = (max: number) =>
    z
        .string()
        .max(max)
        .transform((value) => value.trim());

const DEFAULT_BUSINESS_TYPES = ['Repair services', 'Spare parts'] as const;
const FULL_ADDRESS_PINCODE_PATTERN = /\b[1-9]\d{5}\b/;
const LEGACY_BUSINESS_CITY_ALIAS_MESSAGE = '`city` is no longer accepted in business query filters. Use `locationId` or coordinates instead.';
const LEGACY_BUSINESS_CATEGORY_ALIAS_MESSAGE = '`category` is no longer accepted in business query filters. Use `listingCategoryId` instead.';
const LEGACY_BUSINESS_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin business filters. Use `q` instead.';
const LEGACY_BUSINESS_CITY_ADMIN_ALIAS_MESSAGE = '`city` is no longer accepted in admin business filters. Use `locationId` instead.';

const hasOwn = (value: unknown, key: string): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));

const rejectLegacyBusinessQueryAliases = (
    raw: unknown,
    aliases: Array<{ alias: string; message: string }>
) => {
    const issues = aliases
        .filter(({ alias }) => hasOwn(raw, alias))
        .map(({ alias, message }) => ({
            code: z.ZodIssueCode.custom,
            path: [alias],
            message,
        }));

    if (issues.length === 0) return;
    throw new z.ZodError(issues);
};

export const createBusinessSchema = CreateBusinessPayloadSchema
    .transform((data) => {
        if (!Array.isArray(data.businessTypes) || data.businessTypes.length === 0) {
            data.businessTypes = [...DEFAULT_BUSINESS_TYPES];
        }
        return data;
    });

export const updateBusinessSchema = UpdateBusinessPayloadSchema;

const publicBusinessQuerySchemaBase = z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(1).max(100).optional(),
    locationId: commonSchemas.objectId.optional(),
    listingCategoryId: commonSchemas.objectId.optional(),
    brandId: commonSchemas.objectId.optional(),
    excludeBusinessId: commonSchemas.objectId.optional(),
    serviceOnly: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();

export const publicBusinessQuerySchema = z.preprocess((raw) => {
    rejectLegacyBusinessQueryAliases(raw, [
        { alias: 'city', message: LEGACY_BUSINESS_CITY_ALIAS_MESSAGE },
        { alias: 'category', message: LEGACY_BUSINESS_CATEGORY_ALIAS_MESSAGE },
    ]);
    return raw;
}, publicBusinessQuerySchemaBase);

const adminBusinessStatusFilterSchema = z.enum([
    BUSINESS_STATUS.LIVE,
    BUSINESS_STATUS.PENDING,
    BUSINESS_STATUS.REJECTED,
    BUSINESS_STATUS.SUSPENDED,
    BUSINESS_STATUS.DELETED,
    'all',
    'approved',
    'active',
]);

const adminBusinessAccountsQuerySchemaBase = z.object({
    status: adminBusinessStatusFilterSchema.optional(),
    q: z.string().trim().max(200).optional(),
    locationId: commonSchemas.objectId.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    includeDeleted: z.enum(['true', 'false']).optional(),
    sort: z.string().trim().max(100).optional(),
}).strict();

export const adminBusinessAccountsQuerySchema = z.preprocess((raw) => {
    rejectLegacyBusinessQueryAliases(raw, [
        { alias: 'search', message: LEGACY_BUSINESS_SEARCH_ALIAS_MESSAGE },
        { alias: 'city', message: LEGACY_BUSINESS_CITY_ADMIN_ALIAS_MESSAGE },
    ]);
    return raw;
}, adminBusinessAccountsQuerySchemaBase);

export const adminBusinessRejectSchema = z.object({
    reason: z.string().trim().min(10, 'Rejection reason is required').max(500),
}).strict();

export const adminBusinessStatusSchema = z
    .object({
        status: z.enum([
            BUSINESS_STATUS.LIVE,
            BUSINESS_STATUS.REJECTED,
            BUSINESS_STATUS.SUSPENDED,
            'approved',
            'active',
        ]),
        reason: z.string().trim().max(500).optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
        const normalizedStatus = data.status.toLowerCase();
        if ((normalizedStatus === BUSINESS_STATUS.REJECTED || normalizedStatus === BUSINESS_STATUS.SUSPENDED) && !data.reason) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['reason'],
                message: 'Reason is required for rejection or suspension',
            });
        }
    });

export const adminBusinessUpdateSchema = z.object({
    name: businessNameSchema.optional(),
    description: z.string().trim().max(2000).optional(),
    mobile: businessPhoneSchema.optional(),
    email: z.union([commonSchemas.email, z.literal('')]).optional(),
    website: z.union([z.string().url('Invalid URL format'), z.literal('')]).optional(),
    gstNumber: z.union([
        z.string().regex(BUSINESS_LIMITS.GST.PATTERN, BUSINESS_LIMITS.GST.ERROR_FORMAT),
        z.literal(''),
    ]).optional(),
    registrationNumber: z.union([
        sanitizeString(BUSINESS_LIMITS.REGISTRATION.MIN, BUSINESS_LIMITS.REGISTRATION.MAX),
        z.literal(''),
    ]).optional(),
    businessTypes: z.array(sanitizeString(2, 50)).min(1, 'Select at least one business type').optional(),
    location: z.object({
        locationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID').optional(),
        address: optionalTrimmedString(200).optional(),
        shopNo: optionalTrimmedString(50).optional(),
        street: optionalTrimmedString(100).optional(),
        landmark: optionalTrimmedString(100).optional(),
        city: optionalTrimmedString(50).optional(),
        state: optionalTrimmedString(50).optional(),
        pincode: z.union([
            z.string().regex(BUSINESS_LIMITS.PINCODE.PATTERN, BUSINESS_LIMITS.PINCODE.ERROR_FORMAT),
            z.literal(''),
        ]).optional(),
        coordinates: coordinatesSchema.optional(),
    }).strict().optional(),
}).strict();
