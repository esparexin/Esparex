import { z } from 'zod';
import { commonSchemas } from './common';

export const adminAuditLogQuerySchema = z.object({
    q: z.string().trim().max(120).optional(),
    action: z.string().trim().max(100).optional(),
    targetType: z.string().trim().max(100).optional(),
    adminId: commonSchemas.objectId.optional(),
    requestId: z.string().trim().max(120).optional(),
    correlationId: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
}).strict();
