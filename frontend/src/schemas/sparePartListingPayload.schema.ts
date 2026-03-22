/**
 * Spare Part Listing — Frontend Form Schema
 *
 * Extends BaseSparePartPayloadSchema (shared) with UI-only fields that exist
 * only in the form and are resolved/stripped before API submission:
 *   - category    : display name resolved to categoryId
 *   - brand       : display name resolved to brandId
 *   - sparePartName : display label resolved to sparePartId
 *
 * Fields shared with the backend (title, description, price, images, location,
 * condition, stock, warranty) must stay in sync with shared/schemas/sparePartPayload.schema.ts.
 */

import { z } from 'zod';
import { BaseSparePartPayloadSchema } from '@shared/schemas/sparePartPayload.schema';

// UI-only fields: display names that are resolved to IDs before submission
const uiOnlyFields = z.object({
    category: z.string().min(1, "Category is required"),
    brand: z.string().optional(),
    sparePartName: z.string().optional(),
});

export const SparePartListingPayloadSchema = BaseSparePartPayloadSchema
    .omit({ categoryId: true, sparePartId: true }) // required in base; optional in UI form until resolved
    .merge(z.object({
        categoryId: z.string().optional(),
        sparePartId: z.string().min(1, "Spare part is required"),
    }))
    .merge(uiOnlyFields);

export type SparePartListingFormData = z.infer<typeof SparePartListingPayloadSchema>;
