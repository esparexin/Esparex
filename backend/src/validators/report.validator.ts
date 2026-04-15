import { z } from 'zod';
import { commonSchemas, sanitizeString } from '../middleware/validateRequest';
import { REPORT_REASON_VALUES } from '../../../shared/enums/reportReason';
import { REPORT_TARGET_TYPE_VALUES } from '../models/Report';

const optionalTrimmed = (max: number) =>
    z.string().max(max).transform((val) => val.replace(/<[^>]*>/g, '').trim()).optional();

export const createReportSchema = z.object({
    targetType: z.enum(REPORT_TARGET_TYPE_VALUES).optional(),
    targetId: commonSchemas.objectId.optional(),
    adId: commonSchemas.objectId.optional(),
    adTitle: sanitizeString(1, 200).optional(),
    reason: z.enum(REPORT_REASON_VALUES),
    description: optionalTrimmed(500),
    additionalDetails: optionalTrimmed(500)
}).superRefine((value, ctx) => {
    const hasCanonicalPair = Boolean(value.targetType) || Boolean(value.targetId);
    const hasLegacyAdId = Boolean(value.adId);

    if (hasCanonicalPair) {
        if (!value.targetType || !value.targetId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'targetType and targetId must be provided together',
            });
        }
        return;
    }

    if (!hasLegacyAdId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either targetType+targetId or adId is required',
        });
    }
});
