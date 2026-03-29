import { z } from 'zod';
import { CategoryTypeEnum, ObjectIdSchema } from '../../../shared/schemas/catalog.schema';
import { LISTING_TYPE_VALUES } from '../../../shared/enums/listingType';

/**
 * Common Admin Validation Schemas
 * Used to provide pre-submit guards for admin management forms.
 * Mirrored behavior from shared limits while avoiding Zod instance boundaries.
 */

export const adminCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be 50 characters or fewer'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
    status: z.enum(['live', 'inactive', 'pending', 'rejected']).optional(),
    listingType: z.array(z.enum(LISTING_TYPE_VALUES)).optional(),
    hasScreenSizes: z.boolean().optional()
});

export const adminServiceModerationSchema = z.object({
    moderationStatus: z.enum(['pending', 'live', 'rejected']),
    moderationComment: z.string().max(1000).optional()
});

export const adminBrandSchema = z.object({
    name: z.string().min(1, 'Brand name is required').max(100, 'Brand name too long'),
    categoryIds: z.array(ObjectIdSchema).min(1, 'At least one category is required'),
});

export const adminModelSchema = z.object({
    name: z.string().min(1, 'Model name is required').max(100, 'Model name too long'),
    brandId: ObjectIdSchema,
    categoryId: ObjectIdSchema.optional(),
    categoryIds: z.array(ObjectIdSchema).min(1, 'At least one category is required'),
    status: z.enum(['live', 'pending', 'rejected']).optional()
});

export const adminLocationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    level: z.enum(['state', 'city', 'area']),
    parentId: ObjectIdSchema.optional().nullable(),
    longitude: z.string().refine(v => !isNaN(parseFloat(v)), 'Invalid longitude'),
    latitude: z.string().refine(v => !isNaN(parseFloat(v)), 'Invalid latitude'),
});

const adminRoleSchema = z.enum(['moderator', 'admin', 'super_admin']);
const adminStatusSchema = z.enum(['live', 'inactive', 'suspended', 'banned']);
const permissionsTextSchema = z
    .string()
    .max(2000, 'Permissions list is too long')
    .refine(
        (value) =>
            value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .every((item) => /^[a-z0-9:_-]+$/i.test(item)),
        'Permissions must be comma-separated values like users:read or ads:write',
    );

const adminUserBaseFormSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name is too long'),
    lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name is too long'),
    email: z.string().trim().email('Enter a valid email address'),
    role: adminRoleSchema,
    permissionsText: permissionsTextSchema,
});

export const adminCreateUserFormSchema = adminUserBaseFormSchema.extend({
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const adminEditUserFormSchema = adminUserBaseFormSchema.extend({
    status: adminStatusSchema,
});

export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserFormSchema>;
export type AdminEditUserFormValues = z.infer<typeof adminEditUserFormSchema>;
