import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');

/**
 * Wallet Adjustment Schema
 * CRITICAL: Financial operation validation
 */
export const walletAdjustmentSchema = z.object({
    userId: objectId,

    amount: z.number()
        .refine((v) => v !== 0, 'Amount cannot be zero')
        .refine((v) => Math.abs(v) <= 100000, 'Amount cannot exceed ₹100,000'),

    reason: z.string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason must be less than 500 characters'),

    type: z.enum(['credit', 'debit', 'refund', 'penalty', 'bonus', 'correction'], {
        errorMap: () => ({ message: 'Invalid adjustment type' })
    }),

    reference: z.string()
        .max(100, 'Reference must be less than 100 characters')
        .optional(),

    metadata: z.record(z.string(), z.unknown()).optional()
});

/**
 * Type export
 */
export type WalletAdjustment = z.infer<typeof walletAdjustmentSchema>;
