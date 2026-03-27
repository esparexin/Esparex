import { z } from 'zod';
import { CATALOG_STATUS } from '../../../shared/enums/catalogStatus';
import { CATEGORY_TYPES } from '../../../shared/schemas/catalog.schema';
import { normalizeObjectIdLike } from '../utils/idUtils';

// Shared Helpers
const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');


const optionalObjectIdSchema = z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    return normalizeObjectIdLike(value) ?? value;
}, objectIdSchema.optional());

const requiredObjectIdSchema = z.preprocess(
    (value) => normalizeObjectIdLike(value) ?? value, 
    objectIdSchema
);

// Common rejection schema
export const rejectionSchema = z.object({
    reason: z.string().trim().min(1).max(500)
}).strict();

// Centralized Category Logic
const categoryFields = {
    categoryIds: z.array(requiredObjectIdSchema).min(1).optional(),
    categoryId: optionalObjectIdSchema
};

const categoryRefine = (data: any) => data.categoryIds || data.categoryId;
const categoryRefineMsg = {
    message: "At least one category is required",
    path: ["categoryIds"]
};


// ==========================================
// CATEGORIES
// ==========================================
const categoryBaseSchema = z.object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(160).optional(),
    type: z.enum(CATEGORY_TYPES).optional(),
    icon: z.string().trim().max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    parentId: optionalObjectIdSchema,
    isActive: z.boolean().optional(),
    hasScreenSizes: z.boolean().optional(),
    listingType: z.array(z.enum(['ad', 'service', 'spare_part', 'postad', 'postservice', 'postsparepart']))
        .transform(arr => arr.map(v => {
            if (v === 'postad') return 'ad';
            if (v === 'postservice') return 'service';
            if (v === 'postsparepart') return 'spare_part';
            return v;
        }))
        .optional(),
    filters: z.array(z.unknown()).optional()
});

export const categoryCreateSchema = categoryBaseSchema
    .extend({
        type: z.enum(['ad', 'spare_part', 'service', 'other', 'AD', 'SPARE_PART', 'SERVICE', 'OTHER'])
            .transform(v => v.toLowerCase() as 'ad' | 'spare_part' | 'service' | 'other')
            .optional()
            .default('ad'),
    })
    .strict();

export const categoryUpdateSchema = categoryBaseSchema
    .extend({
        type: z.enum(['ad', 'spare_part', 'service', 'other', 'AD', 'SPARE_PART', 'SERVICE', 'OTHER'])
            .transform(v => v.toLowerCase() as 'ad' | 'spare_part' | 'service' | 'other')
            .optional(),
    })
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const categorySchemaUpdateBodySchema = z.object({
    filters: z.array(z.unknown())
}).strict();

export const toggleCategoryStatusSchema = z.object({}).strict();

// ==========================================
// BRANDS & MODELS
// ==========================================
const brandBaseSchema = z.object({
    name: z.string().trim().min(1).max(120),
    ...categoryFields,
    isActive: z.boolean().optional(),
    status: z.enum([CATALOG_STATUS.ACTIVE, CATALOG_STATUS.INACTIVE, CATALOG_STATUS.PENDING, CATALOG_STATUS.REJECTED]).optional(),
    suggestedBy: optionalObjectIdSchema,
    rejectionReason: z.string().trim().max(500).optional()
}).strict();

export const brandCreateSchema = brandBaseSchema.refine(categoryRefine, categoryRefineMsg);

export const brandUpdateSchema = brandBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const modelCreateSchema = z.object({
    name: z.string().trim().min(1).max(120),
    brandId: requiredObjectIdSchema,
    categoryId: optionalObjectIdSchema,
    categoryIds: z.array(requiredObjectIdSchema).min(1).optional(),
    isActive: z.boolean().optional(),
    status: z.enum([CATALOG_STATUS.ACTIVE, CATALOG_STATUS.INACTIVE, CATALOG_STATUS.PENDING, CATALOG_STATUS.REJECTED]).optional(),
    suggestedBy: optionalObjectIdSchema,
    rejectionReason: z.string().trim().max(500).optional()
}).strict();

export const modelUpdateSchema = modelCreateSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const ensureModelSchema = z.object({
    categoryId: requiredObjectIdSchema,
    brandName: z.string().trim().min(1).max(120),
    modelName: z.string().trim().min(1).max(120)
});

// ==========================================
// SPARE PARTS
// ==========================================
const sparePartBaseSchema = z.object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(160).optional(),
    // type: z.enum(['PRIMARY', 'SECONDARY']).optional(),
    listingType: z.array(z.enum(['ad', 'spare_part'])).optional(),
    ...categoryFields,
    sortOrder: z.number().int().min(0).optional(),
    filters: z.array(z.unknown()).optional(),
    isActive: z.boolean().optional(),
    rejectionReason: z.string().trim().max(500).optional(),
    brandId: objectIdSchema.optional(),
    modelId: objectIdSchema.optional()
}).strict();

export const sparePartCreateSchema = sparePartBaseSchema.refine(categoryRefine, categoryRefineMsg);

export const sparePartUpdateSchema = sparePartBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

// ==========================================
// REFERENCE DATA
// ==========================================
const serviceTypeBaseSchema = z.object({
    name: z.string().trim().min(1).max(120),
    ...categoryFields,
    isActive: z.boolean().optional()
}).strict();

export const serviceTypeCreateSchema = serviceTypeBaseSchema.refine(categoryRefine, categoryRefineMsg);

export const serviceTypeUpdateSchema = serviceTypeBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');

export const screenSizeCreateSchema = z.object({
    size: z.string().trim().min(1).max(20),
    name: z.string().trim().min(1).max(120).optional(),
    value: z.number().int().min(1).max(500),
    categoryId: objectIdSchema,
    brandId: objectIdSchema.optional(),
    isActive: z.boolean().optional()
}).strict();

export const screenSizeUpdateSchema = screenSizeCreateSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
