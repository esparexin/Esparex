/**
 * Service Listing — Frontend Form Schema
 *
 * Extends BaseServicePayloadSchema (shared) with:
 *   1. A richer frontend locationMetaSchema (city, state, display, coordinates)
 *   2. Plain z.string() overrides for ObjectId fields — ObjectIdSchema uses z.preprocess
 *      which TypeScript infers as `unknown` output, breaking react-hook-form Resolver typing.
 *
 * All text validation (min/max lengths, profanity, gibberish) is inherited from
 * BaseServicePayloadSchema → validatedTextSchema, keeping frontend in sync with backend.
 */

import { z } from 'zod';
import { BaseServicePayloadSchema } from '@shared/schemas/servicePayload.schema';

// Frontend location shape — richer than the backend's z.any().optional()
const locationMetaSchema = z.object({
    locationId: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    display: z.string().optional(),
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }),
}).optional();

// ObjectIdSchema uses z.preprocess which TypeScript infers as `unknown` output.
// Override with plain z.string() so react-hook-form can infer the correct field types.
const stringId = z.string().optional();
const requiredStringId = z.string().min(1, 'Required');

export const ServiceListingPayloadSchema = BaseServicePayloadSchema
    .omit({
        location: true,
        locationId: true,
        categoryId: true,
        brandId: true,
        modelId: true,
        serviceTypeIds: true,
    })
    .merge(z.object({
        location: locationMetaSchema,
        locationId: stringId,
        categoryId: requiredStringId,
        brandId: stringId,
        modelId: stringId,
        // serviceTypeIds uses ObjectIdSchema (z.preprocess → unknown output); override with plain string[]
        serviceTypeIds: z.array(z.string()).optional(),
    }));

export type ServiceListingFormData = z.infer<typeof ServiceListingPayloadSchema>;
