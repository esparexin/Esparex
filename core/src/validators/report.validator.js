"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReportSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const reportReason_1 = require("@core/constants/enums/reportReason");
const Report_1 = require("@core/models/Report");
const optionalTrimmed = (max) => zod_1.z.string().max(max).transform((val) => val.replace(/<[^>]*>/g, '').trim()).optional();
exports.createReportSchema = zod_1.z.object({
    targetType: zod_1.z.enum(Report_1.REPORT_TARGET_TYPE_VALUES).optional(),
    targetId: common_1.commonSchemas.objectId.optional(),
    adId: common_1.commonSchemas.objectId.optional(),
    adTitle: (0, common_1.sanitizeString)(1, 200).optional(),
    reason: zod_1.z.enum(reportReason_1.REPORT_REASON_VALUES),
    description: optionalTrimmed(500),
    additionalDetails: optionalTrimmed(500)
}).superRefine((value, ctx) => {
    const hasCanonicalPair = Boolean(value.targetType) || Boolean(value.targetId);
    const hasLegacyAdId = Boolean(value.adId);
    if (hasCanonicalPair) {
        if (!value.targetType || !value.targetId) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'targetType and targetId must be provided together',
            });
        }
        return;
    }
    if (!hasLegacyAdId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Either targetType+targetId or adId is required',
        });
    }
});
//# sourceMappingURL=report.validator.js.map