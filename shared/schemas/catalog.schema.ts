import { z } from "zod";

// Base Validations
export const ObjectIdSchema = z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
);
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
export const CATEGORY_TYPES = ['AD', 'SPARE_PART', 'SERVICE', 'OTHER'] as const;
export const CategoryTypeEnum = z.enum(CATEGORY_TYPES);
export type CategoryType = z.infer<typeof CategoryTypeEnum>;

export const CreateCategorySchema = z.object({
    name: z.string().min(1).max(50),
    slug: SlugSchema,
    type: CategoryTypeEnum.default('AD'),
    icon: z.string().optional(),
    description: z.string().optional(),
    parentId: ObjectIdSchema.optional(),
    isActive: z.boolean().default(true),
    listingType: z.array(z.enum(['postad', 'postservice', 'postsparepart'])).optional(),
    // Deprecated: Use listingType.includes('postsparepart')
    // supportsSpareParts: z.boolean().default(false),
    serviceSelectionMode: z.enum(['single', 'multi']).default('multi'),
    hasScreenSizes: z.boolean().default(false),
    filters: z.array(CategoryFilterSchema).optional()
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
    categoryId: ObjectIdSchema,
    isActive: z.boolean().default(true)
}).strict();

export const UpdateBrandSchema = CreateBrandSchema.partial();

export const BrandSchema = CreateBrandSchema.extend({
    id: z.string(),
    isDeleted: z.boolean()
});

/* ────────────────────────────────────────────── */
/* MODEL                                          */
/* ────────────────────────────────────────────── */
export const CreateModelSchema = z.object({
    name: z.string().min(1),
    brandId: ObjectIdSchema,
    isActive: z.boolean().default(true),
    status: z.enum(['active', 'pending', 'rejected']).default('active')
}).strict();

export const UpdateModelSchema = CreateModelSchema.partial();

export const ModelSchema = CreateModelSchema.extend({
    id: z.string(),
    isDeleted: z.boolean()
});

/* ────────────────────────────────────────────── */
/* SPARE PART                                     */
/* ────────────────────────────────────────────── */
export const CreateSparePartSchema = z.object({
    name: z.string().min(2),
    slug: SlugSchema.optional(),
    // type: z.enum(['PRIMARY', 'SECONDARY']).optional(),
    listingType: z.array(z.enum(['postad', 'postsparepart'])).optional(),
    categories: z.array(ObjectIdSchema).min(1, "At least one category is required"),
    brandId: ObjectIdSchema.optional(),
    modelId: ObjectIdSchema.optional(),
    sortOrder: z.number().default(0),
    isActive: z.boolean().default(false),
    status: z.enum(['pending', 'active', 'inactive', 'rejected']).default('pending'),
    rejectionReason: z.string().optional()
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
