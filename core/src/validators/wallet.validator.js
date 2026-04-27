"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletAdjustmentSchema = void 0;
const zod_1 = require("zod");
const objectId = zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');
/**
 * Wallet Adjustment Schema
 * CRITICAL: Financial operation validation
 */
exports.walletAdjustmentSchema = zod_1.z.object({
    userId: objectId,
    amount: zod_1.z.number()
        .refine((v) => v !== 0, 'Amount cannot be zero')
        .refine((v) => Math.abs(v) <= 100000, 'Amount cannot exceed ₹100,000'),
    reason: zod_1.z.string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason must be less than 500 characters'),
    type: zod_1.z.enum(['credit', 'debit', 'refund', 'penalty', 'bonus', 'correction'], {
        errorMap: () => ({ message: 'Invalid adjustment type' })
    }),
    reference: zod_1.z.string()
        .max(100, 'Reference must be less than 100 characters')
        .optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional()
});
//# sourceMappingURL=wallet.validator.js.map