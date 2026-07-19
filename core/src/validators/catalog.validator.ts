import { z } from 'zod';
import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';

import { LISTING_TYPE, LISTING_TYPE_VALUES } from '@esparex/contracts';
import { normalizeObjectIdLike } from '../utils/idUtils';
import { hasCatalogPollution } from '../utils/catalogGovernance';

// Shared Helpers
const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');


const optionalObjectIdSchema = z.preprocess((value) => {
    if (value === undefined || value === undefined || value === '') return undefined;
    return normalizeObjectIdLike(value) ?? value;
}, objectIdSchema.optional());

const requiredObjectIdSchema = z.preprocess(
    (value) => normalizeObjectIdLike(value) ?? value, 
    objectIdSchema
);

const cleanCatalogText = (maxLength: number) => z.string()
    .trim()
    .min(1)
    .max(maxLength)
    .refine((value) => !hasCatalogPollution(value), 'Catalog text cannot contain HTML, stack traces, build logs, or runtime error output');

const optionalCleanCatalogText = (maxLength: number) => z.string()
    .trim()
    .max(maxLength)
    .refine((value) => !hasCatalogPollution(value), 'Catalog text cannot contain HTML, stack traces, build logs, or runtime error output')
    .optional();

// Common rejection schema
export const rejectionSchema = z.object({
    reason: z.string().trim().min(1).max(500)
}).strict();

// Centralized Category Logic
const categoryFields = {
    categoryIds: z.array(requiredObjectIdSchema).min(1, 'Spare part must be mapped to at least one category')
};

const catalogTextFields = {
    name: cleanCatalogText(120),
    displayName: cleanCatalogText(120).optional(),
    canonicalName: cleanCatalogText(160).optional(),
    slug: cleanCatalogText(160).optional(),
    aliases: z.array(cleanCatalogText(120)).optional(),
    synonyms: z.array(cleanCatalogText(120)).optional(),
};


// ==========================================
// CATEGORIES
// ==========================================
const categoryBaseSchema = z.object({
    ...catalogTextFields,

    icon: optionalCleanCatalogText(255),
    description: optionalCleanCatalogText(2000),
    parentId: optionalObjectIdSchema,
    isActive: z.boolean().optional(),
    hasScreenSizes: z.boolean().optional(),
    listingType: z.array(z.enum(LISTING_TYPE_VALUES)).optional(),
    filters: z.array(z.unknown()).optional()
});

export const categoryCreateSchema = categoryBaseSchema
    .strict();

export const categoryUpdateSchema = categoryBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const categorySchemaUpdateBodySchema = z.object({
    filters: z.array(z.unknown())
}).strict();

// ==========================================
// BRANDS & MODELS
// ==========================================
const brandBaseSchema = z.object({
    ...catalogTextFields,
    ...categoryFields,
    isActive: z.boolean().optional(),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
    suggestedBy: optionalObjectIdSchema,
    rejectionReason: z.string().trim().max(500).optional()
}).strict();

export const brandCreateSchema = brandBaseSchema;

export const brandUpdateSchema = brandBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const modelCreateSchema = z.object({
    ...catalogTextFields,
    brandId: requiredObjectIdSchema,
    categoryIds: z.array(requiredObjectIdSchema),
    parentModelId: optionalObjectIdSchema.nullable(),
    variantOfModelId: optionalObjectIdSchema.nullable(),
    hierarchyPath: z.array(z.string().trim().min(1).max(120)).optional(),
    treeDepth: z.number().int().min(0).optional(),
    variantType: z.string().trim().min(1).max(80).optional(),
    isParentModel: z.boolean().optional(),
    isActive: z.boolean().optional(),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
    suggestedBy: optionalObjectIdSchema,
    rejectionReason: z.string().trim().max(500).optional()
}).strict();

export const modelUpdateSchema = modelCreateSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

// ==========================================
// SPARE PARTS
// ==========================================
const sparePartBaseSchema = z.object({
    ...catalogTextFields,
    // type: z.enum(['PRIMARY', 'SECONDARY']).optional(),
    listingType: z.array(z.enum([LISTING_TYPE.AD, LISTING_TYPE.SPARE_PART])).optional(),
    ...categoryFields,
    sortOrder: z.number().int().min(0).optional(),
    filters: z.array(z.unknown()).optional(),
    isActive: z.boolean().optional(),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
    rejectionReason: z.string().trim().max(500).optional(),
    brandId: objectIdSchema.optional(),
    modelId: objectIdSchema.optional()
}).strict();

export const sparePartCreateSchema = sparePartBaseSchema;

export const sparePartUpdateSchema = sparePartBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

// ==========================================
// REFERENCE DATA
// ==========================================
const serviceTypeBaseSchema = z.object({
    ...catalogTextFields,
    ...categoryFields,
    isActive: z.boolean().optional(),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
}).strict();

export const serviceTypeCreateSchema = serviceTypeBaseSchema;

export const serviceTypeUpdateSchema = serviceTypeBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const screenSizeCreateSchema = z.object({
    size: z.string().trim().min(1).max(20),
    displayName: catalogTextFields.displayName,
    canonicalName: catalogTextFields.canonicalName,
    slug: catalogTextFields.slug,
    aliases: catalogTextFields.aliases,
    synonyms: catalogTextFields.synonyms,
    name: catalogTextFields.name.optional(),
    value: z.number().int().min(1).max(500),
    categoryId: objectIdSchema,
    brandId: objectIdSchema.optional(),
    isActive: z.boolean().optional(),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
}).strict();

export const screenSizeUpdateSchema = screenSizeCreateSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
