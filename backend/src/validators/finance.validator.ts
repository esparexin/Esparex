import { z } from 'zod';
import { PAYMENT_STATUS } from '../../../shared/enums/paymentStatus';

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');
const paymentStatusSchema = z.enum([
    PAYMENT_STATUS.PENDING,
    PAYMENT_STATUS.SUCCESS,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED,
]);
const adminInvoiceStatusFilterSchema = z.enum([
    'all',
    PAYMENT_STATUS.PENDING,
    PAYMENT_STATUS.SUCCESS,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED,
]);
const adminTransactionStatusFilterSchema = z.enum([
    'all',
    PAYMENT_STATUS.INITIATED,
    PAYMENT_STATUS.SUCCESS,
    PAYMENT_STATUS.FAILED,
]);
const adminPlanTypeFilterSchema = z.enum(['all', 'AD_PACK', 'SPOTLIGHT', 'SMART_ALERT']);

const invoiceItemSchema = z.object({
    description: z.string().trim().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0)
});

export const createInvoiceSchema = z.object({
    customerName: z.string().trim().min(1).max(255),
    customerEmail: z.string().email(),
    customerGst: z.string().trim().max(50).optional(),
    items: z.array(invoiceItemSchema).min(1),
    isGstInvoice: z.boolean().optional(),
    currency: z.string().trim().length(3).optional()
}).strict();

export const createPaymentOrderSchema = z.object({
    planId: objectIdSchema
}).strict();

export const adminTransactionQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(100).optional(),
    status: adminTransactionStatusFilterSchema.optional(),
    startDate: z.string().trim().max(50).optional(),
    endDate: z.string().trim().max(50).optional(),
}).strict();

export const adminInvoiceQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(100).optional(),
    status: adminInvoiceStatusFilterSchema.optional(),
}).strict();

export const adminCreateInvoiceSchema = z.object({
    customerEmail: z.string().email(),
    planId: objectIdSchema.optional(),
    amount: z.number().min(0).optional(),
    currency: z.string().trim().length(3).optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
    isGstInvoice: z.boolean().optional(),
    status: paymentStatusSchema.optional(),
}).strict().superRefine((value, ctx) => {
    if (!value.planId && (!value.items || value.items.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['items'],
            message: 'Either planId or at least one item is required',
        });
    }
});

export const adminUpdateInvoiceStatusSchema = z.object({
    status: paymentStatusSchema,
    notes: z.string().trim().max(500).optional(),
}).strict();

export const adminPlanQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    type: adminPlanTypeFilterSchema.optional(),
}).strict();
