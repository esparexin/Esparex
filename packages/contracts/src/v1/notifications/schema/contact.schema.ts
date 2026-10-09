import { z } from 'zod';
import { CONTACT_LIMITS, TEXT_LIMITS } from '../../common/constants/fieldLimits';
import { emailSchema } from '../../common/schema/common.schemas';

/**
 * Contact form submission request DTO (audit E17).
 *
 * Owned by: @esparex/contracts (all API DTO models live here).
 * Consumed by: backend contact controller (request validation) and
 * core ContactService (service input type). Bounds use the shared
 * limit SSOT; default Zod messages are preserved (same numbers).
 */
export const contactSubmissionRequestSchema = z.object({
    name: z.string().min(TEXT_LIMITS.NAME.MIN).max(TEXT_LIMITS.NAME.MAX),
    email: emailSchema,
    mobile: z.string().optional(),
    subject: z.union([z.string().max(CONTACT_LIMITS.SUBJECT.MAX), z.literal('')]).optional(),
    category: z.string().optional(),
    message: z.string().min(CONTACT_LIMITS.MESSAGE.MIN).max(CONTACT_LIMITS.MESSAGE.MAX),
});

export type ContactSubmissionRequest = z.infer<typeof contactSubmissionRequestSchema>;
