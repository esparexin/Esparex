import { z } from 'zod';
import { ObjectIdSchema } from "@esparex/contracts";
import { CreateCategorySchema, CreateBrandSchema, CreateModelSchema } from "@esparex/contracts";

/**
 * Common Admin Validation Schemas
 * Re-exports and extends canonical contract schemas from @esparex/contracts for SSOT compliance.
 */

export const adminCategorySchema = CreateCategorySchema.pick({
    name: true,
    slug: true,
    parentId: true,
    sortOrder: true,
    listingType: true,
    hasScreenSizes: true
}).partial({
    parentId: true,
    sortOrder: true,
    listingType: true,
    hasScreenSizes: true
}).extend({
    status: z.enum(['live', 'inactive', 'pending', 'rejected']).optional(),
});

export const adminServiceModerationSchema = z.object({
    moderationStatus: z.enum(['pending', 'live', 'rejected']),
    moderationComment: z.string().max(1000).optional()
});

export const adminBrandSchema = CreateBrandSchema.pick({
    name: true,
    categoryIds: true,
});

export const adminModelSchema = CreateModelSchema.pick({
    name: true,
    brandId: true,
    categoryIds: true,
    parentModelId: true,
    variantOfModelId: true,
    isParentModel: true,
}).partial({
    parentModelId: true,
    variantOfModelId: true,
    isParentModel: true,
});

export const adminLocationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    level: z.enum(['state', 'city', 'area']),
    parentId: ObjectIdSchema.optional().nullable(),
    longitude: z.string().refine(v => !isNaN(parseFloat(v)), 'Invalid longitude'),
    latitude: z.string().refine(v => !isNaN(parseFloat(v)), 'Invalid latitude'),
});

import { Role } from '@esparex/contracts';

const adminRoleSchema = z.enum(['moderator', 'admin', Role.SUPER_ADMIN, 'superAdmin']);
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
