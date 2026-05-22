import { z } from "zod";
import { LISTING_TYPE, LISTING_TYPE_VALUES } from "../enums/listingType";
import { CATALOG_APPROVAL_STATUS } from "../enums/catalogApprovalStatus";

// Base Validations
export const ObjectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const SlugSchema = z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const CategoryFilterSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['checkbox', 'select', 'range', 'text', 'number']),
    options: z.array(z.object({
        value: z.string(),
        label: z.string()
    })).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string().optional(),
    isRequired: z.boolean().optional(),
    showInFilters: z.boolean().optional()
});

/* ────────────────────────────────────────────── */
/* CATEGORY                                       */
/* ────────────────────────────────────────────── */

export const CreateCategorySchema = z.object({
    name: z.string().min(1).max(50),
    displayName: z.string().min(1).max(50).optional(),
    canonicalName: z.string().min(1).max(80).optional(),
    slug: SlugSchema,
    aliases: z.array(z.string().min(1).max(80)).optional(),
    synonyms: z.array(z.string().min(1).max(80)).optional(),

    icon: z.string().optional(),
    description: z.string().optional(),
    parentId: ObjectIdSchema.optional(),
    isActive: z.boolean().default(true),
    listingType: z.array(z.enum(LISTING_TYPE_VALUES)).optional(),
    serviceSelectionMode: z.enum(['single', 'multi']).default('multi'),
    hasScreenSizes: z.boolean().default(false),
    filters: z.array(CategoryFilterSchema).optional(),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
}).strict();

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CategorySchema = CreateCategorySchema.extend({
    id: z.string(),
    isDeleted: z.boolean(),
    filters: z.array(CategoryFilterSchema).optional(),
    hasScreenSizes: z.boolean()
});

/* ────────────────────────────────────────────── */
/* BRAND                                          */
/* ────────────────────────────────────────────── */
export const CreateBrandSchema = z.object({
    name: z.string().min(2),
    displayName: z.string().min(2).optional(),
    canonicalName: z.string().min(2).max(120).optional(),
    slug: SlugSchema.optional(),
    aliases: z.array(z.string().min(1).max(120)).optional(),
    synonyms: z.array(z.string().min(1).max(120)).optional(),
        categoryIds: z.array(ObjectIdSchema),
    isActive: z.boolean().default(true),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
}).strict();

export const UpdateBrandSchema = CreateBrandSchema.partial();

export const BrandSchema = CreateBrandSchema.extend({
    id: z.string(),
    isDeleted: z.boolean(),
});

/* ────────────────────────────────────────────── */
/* MODEL                                          */
/* ────────────────────────────────────────────── */
export const CreateModelSchema = z.object({
    name: z.string().min(1),
    displayName: z.string().min(1).optional(),
    canonicalName: z.string().min(1).max(120).optional(),
    slug: SlugSchema.optional(),
    aliases: z.array(z.string().min(1).max(120)).optional(),
    synonyms: z.array(z.string().min(1).max(120)).optional(),
    brandId: ObjectIdSchema,
    categoryIds: z.array(ObjectIdSchema),
    parentModelId: ObjectIdSchema.nullable().optional(),
    variantOfModelId: ObjectIdSchema.nullable().optional(),
    hierarchyPath: z.array(z.string()).optional(),
    treeDepth: z.number().int().min(0).optional(),
    variantType: z.string().min(1).max(80).optional(),
    isParentModel: z.boolean().optional(),
    isActive: z.boolean().default(true),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
}).strict();

export const UpdateModelSchema = CreateModelSchema.partial();

export const ModelSchema = CreateModelSchema.extend({
    id: z.string(),
    isDeleted: z.boolean(),
});

/* ────────────────────────────────────────────── */
/* SPARE PART                                     */
/* ────────────────────────────────────────────── */
export const CreateSparePartSchema = z.object({
    name: z.string().min(2),
    displayName: z.string().min(2).optional(),
    canonicalName: z.string().min(2).max(120).optional(),
    slug: SlugSchema.optional(),
    aliases: z.array(z.string().min(1).max(120)).optional(),
    synonyms: z.array(z.string().min(1).max(120)).optional(),
    listingType: z.array(z.enum([LISTING_TYPE.AD, LISTING_TYPE.SPARE_PART])).optional(),
    categoryIds: z.array(ObjectIdSchema),
    brandId: ObjectIdSchema.optional(),
    modelId: ObjectIdSchema.optional(),
    sortOrder: z.number().default(0),
    isActive: z.boolean().default(true),
    approvalStatus: z.enum([CATALOG_APPROVAL_STATUS.PENDING, CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.REJECTED]).optional(),
}).strict();

export const UpdateSparePartSchema = CreateSparePartSchema.partial();

export const SparePartSchema = CreateSparePartSchema.extend({
    id: z.string(),
    isDeleted: z.boolean(),
    usageCount: z.number(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

/* ────────────────────────────────────────────── */
/* TYPES                                          */
/* ────────────────────────────────────────────── */
export type CategoryFilter = z.infer<typeof CategoryFilterSchema>;
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
export type Category = z.infer<typeof CategorySchema>;

export type CreateBrandDTO = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandDTO = z.infer<typeof UpdateBrandSchema>;
export type Brand = z.infer<typeof BrandSchema>;

export type CreateModelDTO = z.infer<typeof CreateModelSchema>;
export type UpdateModelDTO = z.infer<typeof UpdateModelSchema>;
export type Model = z.infer<typeof ModelSchema>;

export type CreateSparePartDTO = z.infer<typeof CreateSparePartSchema>;
export type UpdateSparePartDTO = z.infer<typeof UpdateSparePartSchema>;
export type SparePart = z.infer<typeof SparePartSchema>;
