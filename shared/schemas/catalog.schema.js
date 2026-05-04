"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SparePartSchema = exports.UpdateSparePartSchema = exports.CreateSparePartSchema = exports.ModelSchema = exports.UpdateModelSchema = exports.CreateModelSchema = exports.BrandSchema = exports.UpdateBrandSchema = exports.CreateBrandSchema = exports.CategorySchema = exports.UpdateCategorySchema = exports.CreateCategorySchema = exports.CategoryTypeEnum = exports.CATEGORY_TYPES = exports.CategoryFilterSchema = exports.ObjectIdSchema = void 0;
const zod_1 = require("zod");
const listingType_1 = require("../enums/listingType");
// Base Validations
exports.ObjectIdSchema = zod_1.z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const SlugSchema = zod_1.z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");
exports.CategoryFilterSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['checkbox', 'select', 'range', 'text', 'number']),
    options: zod_1.z.array(zod_1.z.object({
        value: zod_1.z.string(),
        label: zod_1.z.string()
    })).optional(),
    min: zod_1.z.number().optional(),
    max: zod_1.z.number().optional(),
    unit: zod_1.z.string().optional(),
    isRequired: zod_1.z.boolean().optional(),
    showInFilters: zod_1.z.boolean().optional()
});
/* ────────────────────────────────────────────── */
/* CATEGORY                                       */
/* ────────────────────────────────────────────── */
exports.CATEGORY_TYPES = ['AD', 'SPARE_PART', 'SERVICE', 'OTHER'];
exports.CategoryTypeEnum = zod_1.z.enum(exports.CATEGORY_TYPES);
exports.CreateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    slug: SlugSchema,
    type: exports.CategoryTypeEnum.default('AD'),
    icon: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    parentId: exports.ObjectIdSchema.optional(),
    isActive: zod_1.z.boolean().default(true),
    listingType: zod_1.z.array(zod_1.z.enum(listingType_1.LISTING_TYPE_VALUES)).optional(),
    // Deprecated: Use listingType.includes('spare_part')
    // supportsSpareParts: z.boolean().default(false),
    serviceSelectionMode: zod_1.z.enum(['single', 'multi']).default('multi'),
    hasScreenSizes: zod_1.z.boolean().default(false),
    filters: zod_1.z.array(exports.CategoryFilterSchema).optional()
}).strict();
exports.UpdateCategorySchema = exports.CreateCategorySchema.partial();
exports.CategorySchema = exports.CreateCategorySchema.extend({
    id: zod_1.z.string(),
    isDeleted: zod_1.z.boolean(),
    filters: zod_1.z.array(exports.CategoryFilterSchema).optional(),
    hasScreenSizes: zod_1.z.boolean()
});
/* ────────────────────────────────────────────── */
/* BRAND                                          */
/* ────────────────────────────────────────────── */
exports.CreateBrandSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    categoryIds: zod_1.z.array(exports.ObjectIdSchema).min(1, "At least one category is required"),
    isActive: zod_1.z.boolean().default(true),
    status: zod_1.z.enum(['live', 'pending', 'rejected', 'inactive']).default('live')
}).strict();
exports.UpdateBrandSchema = exports.CreateBrandSchema.partial();
exports.BrandSchema = exports.CreateBrandSchema.extend({
    id: zod_1.z.string(),
    isDeleted: zod_1.z.boolean()
});
/* ────────────────────────────────────────────── */
/* MODEL                                          */
/* ────────────────────────────────────────────── */
exports.CreateModelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    brandId: exports.ObjectIdSchema,
    categoryIds: zod_1.z.array(exports.ObjectIdSchema).min(1, "At least one category is required"),
    isActive: zod_1.z.boolean().default(true),
    status: zod_1.z.enum(['live', 'pending', 'rejected', 'inactive']).default('live')
}).strict();
exports.UpdateModelSchema = exports.CreateModelSchema.partial();
exports.ModelSchema = exports.CreateModelSchema.extend({
    id: zod_1.z.string(),
    isDeleted: zod_1.z.boolean()
});
/* ────────────────────────────────────────────── */
/* SPARE PART                                     */
/* ────────────────────────────────────────────── */
exports.CreateSparePartSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    slug: SlugSchema.optional(),
    listingType: zod_1.z.array(zod_1.z.enum([listingType_1.LISTING_TYPE.AD, listingType_1.LISTING_TYPE.SPARE_PART])).optional(),
    categoryIds: zod_1.z.array(exports.ObjectIdSchema).min(1, "At least one category is required"),
    brandId: exports.ObjectIdSchema.optional(),
    modelId: exports.ObjectIdSchema.optional(),
    sortOrder: zod_1.z.number().default(0),
    isActive: zod_1.z.boolean().default(true)
}).strict();
exports.UpdateSparePartSchema = exports.CreateSparePartSchema.partial();
exports.SparePartSchema = exports.CreateSparePartSchema.extend({
    id: zod_1.z.string(),
    isDeleted: zod_1.z.boolean(),
    usageCount: zod_1.z.number(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional()
});
//# sourceMappingURL=catalog.schema.js.map