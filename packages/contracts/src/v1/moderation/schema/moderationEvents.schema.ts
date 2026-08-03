/**
 * Moderation Event Schemas & DTOs — Enterprise Platform SSOT
 */
import { z } from 'zod';
import { ModerationResultSchema } from './moderationResult.schema';

export const ImageModeratedEventSchema = z.object({
    imageId: z.string(),
    entityId: z.string(),
    entityType: z.enum(['ad', 'service', 'spare_part', 'profile_photo', 'document']),
    result: ModerationResultSchema,
    timestamp: z.number(),
});

export const ListingHeldForReviewEventSchema = z.object({
    listingId: z.string(),
    listingType: z.enum(['ad', 'service', 'spare_part']),
    sellerId: z.string(),
    result: ModerationResultSchema,
    timestamp: z.number(),
});

export type ImageModeratedEventDTO = z.infer<typeof ImageModeratedEventSchema>;
export type ListingHeldForReviewEventDTO = z.infer<typeof ListingHeldForReviewEventSchema>;
