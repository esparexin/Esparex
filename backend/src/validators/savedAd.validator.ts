/**
 * Saved Ad Validation Schemas
 * 
 * Zod schemas for validating saved ad requests
 */

import { z } from 'zod';
import { commonSchemas } from '../middleware/validateRequest';

/**
 * Save Ad Schema (Body)
 */
export const saveAdSchema = z.object({
    adId: commonSchemas.objectId,
}).strict();

/**
 * Saved Ad Param Schema
 */
export const savedAdParamSchema = z.object({
    adId: commonSchemas.objectId,
});

/**
 * Get Saved Ads Query Schema
 */
export const getSavedAdsQuerySchema = commonSchemas.pagination.extend({
    // Optional filters if needed later
}).strict();

