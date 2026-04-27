"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenSizeUpdateSchema = exports.screenSizeCreateSchema = exports.serviceTypeUpdateSchema = exports.serviceTypeCreateSchema = exports.sparePartUpdateSchema = exports.sparePartCreateSchema = exports.ensureModelSchema = exports.modelUpdateSchema = exports.modelCreateSchema = exports.brandUpdateSchema = exports.brandCreateSchema = exports.toggleCategoryStatusSchema = exports.categorySchemaUpdateBodySchema = exports.categoryUpdateSchema = exports.categoryCreateSchema = exports.rejectionSchema = void 0;
const zod_1 = require("zod");
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const catalog_schema_1 = require("@shared/schemas/catalog.schema");
const listingType_1 = require("@core/constants/enums/listingType");
const idUtils_1 = require("@core/utils/idUtils");
// Shared Helpers
const objectIdSchema = zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');
const optionalObjectIdSchema = zod_1.z.preprocess((value) => {
    if (value === undefined || value === null || value === '')
        return undefined;
    return (0, idUtils_1.normalizeObjectIdLike)(value) ?? value;
}, objectIdSchema.optional());
const requiredObjectIdSchema = zod_1.z.preprocess((value) => (0, idUtils_1.normalizeObjectIdLike)(value) ?? value, objectIdSchema);
// Common rejection schema
exports.rejectionSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1).max(500)
}).strict();
// Centralized Category Logic
const categoryFields = {
    categoryIds: zod_1.z.array(requiredObjectIdSchema).min(1).optional(),
    categoryId: optionalObjectIdSchema
};
const categoryRefine = (data) => data.categoryIds || data.categoryId;
const categoryRefineMsg = {
    message: "At least one category is required",
    path: ["categoryIds"]
};
// ==========================================
// CATEGORIES
// ==========================================
const categoryBaseSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    slug: zod_1.z.string().trim().min(1).max(160).optional(),
    type: zod_1.z.enum(catalog_schema_1.CATEGORY_TYPES).optional(),
    icon: zod_1.z.string().trim().max(255).optional(),
    description: zod_1.z.string().trim().max(2000).optional(),
    parentId: optionalObjectIdSchema,
    isActive: zod_1.z.boolean().optional(),
    hasScreenSizes: zod_1.z.boolean().optional(),
    listingType: zod_1.z.array(zod_1.z.enum(listingType_1.LISTING_TYPE_VALUES)).optional(),
    filters: zod_1.z.array(zod_1.z.unknown()).optional()
});
exports.categoryCreateSchema = categoryBaseSchema
    .extend({
    type: zod_1.z.enum(['ad', 'spare_part', 'service', 'other', 'AD', 'SPARE_PART', 'SERVICE', 'OTHER'])
        .transform(v => v.toLowerCase())
        .optional()
        .default('ad'),
})
    .strict();
exports.categoryUpdateSchema = categoryBaseSchema
    .extend({
    type: zod_1.z.enum(['ad', 'spare_part', 'service', 'other', 'AD', 'SPARE_PART', 'SERVICE', 'OTHER'])
        .transform(v => v.toLowerCase())
        .optional(),
})
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
exports.categorySchemaUpdateBodySchema = zod_1.z.object({
    filters: zod_1.z.array(zod_1.z.unknown())
}).strict();
exports.toggleCategoryStatusSchema = zod_1.z.object({}).strict();
// ==========================================
// BRANDS & MODELS
// ==========================================
const brandBaseSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    ...categoryFields,
    isActive: zod_1.z.boolean().optional(),
    status: zod_1.z.enum([catalogStatus_1.CATALOG_STATUS.ACTIVE, catalogStatus_1.CATALOG_STATUS.INACTIVE, catalogStatus_1.CATALOG_STATUS.PENDING, catalogStatus_1.CATALOG_STATUS.REJECTED]).optional(),
    suggestedBy: optionalObjectIdSchema,
    rejectionReason: zod_1.z.string().trim().max(500).optional()
}).strict();
exports.brandCreateSchema = brandBaseSchema.refine(categoryRefine, categoryRefineMsg);
exports.brandUpdateSchema = brandBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
exports.modelCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    brandId: requiredObjectIdSchema,
    categoryId: optionalObjectIdSchema,
    categoryIds: zod_1.z.array(requiredObjectIdSchema).min(1).optional(),
    isActive: zod_1.z.boolean().optional(),
    status: zod_1.z.enum([catalogStatus_1.CATALOG_STATUS.ACTIVE, catalogStatus_1.CATALOG_STATUS.INACTIVE, catalogStatus_1.CATALOG_STATUS.PENDING, catalogStatus_1.CATALOG_STATUS.REJECTED]).optional(),
    suggestedBy: optionalObjectIdSchema,
    rejectionReason: zod_1.z.string().trim().max(500).optional()
}).strict();
exports.modelUpdateSchema = exports.modelCreateSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
exports.ensureModelSchema = zod_1.z.object({
    categoryId: requiredObjectIdSchema,
    brandName: zod_1.z.string().trim().min(1).max(120),
    modelName: zod_1.z.string().trim().min(1).max(120)
});
// ==========================================
// SPARE PARTS
// ==========================================
const sparePartBaseSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    slug: zod_1.z.string().trim().min(1).max(160).optional(),
    // type: z.enum(['PRIMARY', 'SECONDARY']).optional(),
    listingType: zod_1.z.array(zod_1.z.enum([listingType_1.LISTING_TYPE.AD, listingType_1.LISTING_TYPE.SPARE_PART])).optional(),
    ...categoryFields,
    sortOrder: zod_1.z.number().int().min(0).optional(),
    filters: zod_1.z.array(zod_1.z.unknown()).optional(),
    isActive: zod_1.z.boolean().optional(),
    rejectionReason: zod_1.z.string().trim().max(500).optional(),
    brandId: objectIdSchema.optional(),
    modelId: objectIdSchema.optional()
}).strict();
exports.sparePartCreateSchema = sparePartBaseSchema.refine(categoryRefine, categoryRefineMsg);
exports.sparePartUpdateSchema = sparePartBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
// ==========================================
// REFERENCE DATA
// ==========================================
const serviceTypeBaseSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    ...categoryFields,
    isActive: zod_1.z.boolean().optional()
}).strict();
exports.serviceTypeCreateSchema = serviceTypeBaseSchema.refine(categoryRefine, categoryRefineMsg);
exports.serviceTypeUpdateSchema = serviceTypeBaseSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
exports.screenSizeCreateSchema = zod_1.z.object({
    size: zod_1.z.string().trim().min(1).max(20),
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    value: zod_1.z.number().int().min(1).max(500),
    categoryId: objectIdSchema,
    brandId: objectIdSchema.optional(),
    isActive: zod_1.z.boolean().optional()
}).strict();
exports.screenSizeUpdateSchema = exports.screenSizeCreateSchema
    .partial()
    .strict()
    .refine((payload) => Object.keys(payload).length > 0, 'At least one field is required');
//# sourceMappingURL=catalog.validator.js.map