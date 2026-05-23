import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');

const optionalObjectIdSchema = z.preprocess((value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim().length === 0) return undefined;
    return value;
}, objectIdSchema.optional());

export const catalogRequestTypeSchema = z.enum(['brand', 'model']);

export const catalogRequestStatusSchema = z.enum([
    'pending',
    'approved',
    'rejected',
    'duplicate',
]);

export const createCatalogRequestSchema = z
    .object({
        requestType: catalogRequestTypeSchema,
        categoryId: objectIdSchema,
        parentBrandId: optionalObjectIdSchema,
        requestedName: z.string().trim().min(1).max(120),
        /** Optional soft reference to the listing that triggered this suggestion. */
        listingId: optionalObjectIdSchema,
    })
    .strict()
    .superRefine((payload, ctx) => {
        if (payload.requestType === 'model' && !payload.parentBrandId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['parentBrandId'],
                message: 'parentBrandId is required for model requests.',
            });
        }

        if (payload.requestType === 'brand' && payload.parentBrandId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['parentBrandId'],
                message: 'parentBrandId must be omitted for brand requests.',
            });
        }
    });

const paginationSchema = {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
};

const searchSchema = z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(120).optional());

export const catalogRequestListQuerySchema = z
    .object({
        status: z.enum(['all', ...catalogRequestStatusSchema.options]).optional().default('all'),
        requestType: catalogRequestTypeSchema.optional(),
        q: searchSchema,
        page: paginationSchema.page,
        limit: paginationSchema.limit,
    })
    .passthrough();

export const adminCatalogRequestListQuerySchema = catalogRequestListQuerySchema;

export const adminCatalogRequestStatsQuerySchema = z
    .object({
        requestType: catalogRequestTypeSchema.optional(),
    })
    .passthrough();

export const approveCatalogRequestSchema = z
    .object({
        adminNotes: z.string().trim().max(1200).optional(),
    })
    .strict();

export const rejectCatalogRequestSchema = z
    .object({
        rejectionReason: z.string().trim().min(1).max(500),
        adminNotes: z.string().trim().max(1200).optional(),
    })
    .strict();

export const markCatalogRequestDuplicateSchema = z
    .object({
        duplicateOfEntityId: objectIdSchema,
        adminNotes: z.string().trim().max(1200).optional(),
    })
    .strict();

export const bulkApproveCatalogRequestSchema = z.object({
    requestIds: z.array(objectIdSchema).min(1, 'At least one request ID is required'),
});

export const bulkRejectCatalogRequestSchema = bulkApproveCatalogRequestSchema.extend({
    reason: z.string().trim().min(1).max(500),
});

export const bulkMarkCatalogRequestDuplicateSchema = bulkApproveCatalogRequestSchema.extend({
    duplicateOfId: objectIdSchema,
});
