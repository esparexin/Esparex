import { z } from 'zod';

/**
 * Frontend mirrors of backend location validators.
 * Keep in sync with backend/src/validators/location.validator.ts
 */

export const coordinatesSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90),   // latitude
  ]),
});

export const ingestLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name required'),
  state: z.string().trim().min(1, 'State required'),
  coordinates: coordinatesSchema,
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  radius: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

export const logLocationEventSchema = z.object({
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  source: z.enum(['auto', 'ip', 'manual', 'default']),
  eventType: z.string().min(1),
  reason: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
});

export const appLocationSchema = z.object({
  formattedAddress: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  source: z.enum(['auto', 'ip', 'manual', 'default']),
  locationId: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
  pincode: z.string().optional(),
  level: z.string().optional(),
  name: z.string().optional(),
  display: z.string().optional(),
  detectedAt: z.number().optional(),
  isAuto: z.boolean().optional(),
});
