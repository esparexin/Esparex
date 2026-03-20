import { z } from 'zod';

export const promoteAdSchema = z.object({
    days: z.number()
        .int("Days must be an integer")
        .min(1, "Days must be at least 1")
        .max(365, "Days cannot exceed 365"), // Reasonable upper limit
    type: z.enum(['spotlight', 'top_listing', 'urgent']).optional().default('spotlight'),
    planType: z.string().optional(), // Frontend sends this
    amount: z.number().optional() // Frontend sends this
}).strict();
