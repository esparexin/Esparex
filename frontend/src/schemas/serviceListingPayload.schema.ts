/**
 * Service Listing — Frontend Form Schema
 *
 * Extends BaseServicePayloadSchema (shared) with plain z.string() overrides for
 * ObjectId fields — ObjectIdSchema uses z.preprocess
 *      which TypeScript infers as `unknown` output, breaking react-hook-form Resolver typing.
 *
 * All text validation (min/max lengths, profanity, gibberish) is inherited from
 * BaseServicePayloadSchema → validatedTextSchema, keeping frontend in sync with backend.
 */

import { z } from 'zod';
import { BaseServicePayloadSchema } from '@shared/schemas/servicePayload.schema';

// ObjectIdSchema uses z.preprocess which TypeScript infers as `unknown` output.
// Override with plain z.string() so react-hook-form can infer the correct field types.
const stringId = z.string().optional();
const requiredStringId = z.string().min(1, 'Required');

export const ServiceListingPayloadSchema = BaseServicePayloadSchema
    .omit({
        categoryId: true,
        brandId: true,
        modelId: true,
        serviceTypeIds: true,
        priceMin: true,
    })
    .merge(z.object({
        categoryId: requiredStringId,
        brandId: stringId,
        modelId: stringId,
        // serviceTypeIds uses ObjectIdSchema (z.preprocess → unknown output); override with plain string[]
        serviceTypeIds: z.array(z.string()).min(1, 'Select at least one service type'),
        // Single price field — mapped to priceMin on submit (backend expects priceMin)
        price: z.number({ invalid_type_error: 'Enter a valid price' }).min(0, 'Price must be at least 0'),
    }));

export type ServiceListingFormData = z.infer<typeof ServiceListingPayloadSchema>;
