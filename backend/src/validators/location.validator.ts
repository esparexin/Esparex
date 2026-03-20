import { z } from 'zod';

export const logLocationEventSchema = z.object({
    source: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()])
    }).optional(),
    reason: z.string().trim().optional(),
    eventType: z.string().trim().optional(),
    locationId: z.string().trim().optional()
}).strict();

export const ingestLocationSchema = z.object({
    name: z.string().trim().min(1),
    state: z.string().trim().min(1),
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()])
    }),
    radius: z.number().positive().optional(),
    tags: z.array(z.string()).optional()
}).passthrough(); // Allow extra props based on what the ingest service takes natively
