import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');

export const createInvoiceSchema = z.object({
    customerName: z.string().trim().min(1).max(255),
    customerEmail: z.string().email(),
    customerGst: z.string().trim().max(50).optional(),
    items: z.array(z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0)
    })).min(1),
    isGstInvoice: z.boolean().optional(),
    currency: z.string().trim().length(3).optional()
}).strict();

export const createPaymentOrderSchema = z.object({
    planId: objectIdSchema
}).strict();
