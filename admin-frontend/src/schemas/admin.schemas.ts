import { z } from 'zod';
import { CategoryTypeEnum, ObjectIdSchema } from '../../../shared/schemas/catalog.schema';

/**
 * Common Admin Validation Schemas
 * Used to provide pre-submit guards for admin management forms.
 * Mirrored behavior from shared limits while avoiding Zod instance boundaries.
 */

export const adminCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be 50 characters or fewer'),
    slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
    status: z.enum(['live', 'inactive', 'pending', 'rejected']).optional()
});

export const adminBusinessApprovalSchema = z.object({
    reason: z.string().min(10, 'Reason for rejection/approval must be descriptive').max(500).optional(),
    status: z.enum(['PENDING', 'LIVE', 'REJECTED'])
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
    categoryId: ObjectIdSchema,
    status: z.enum(['live', 'pending', 'rejected']).optional()
});
