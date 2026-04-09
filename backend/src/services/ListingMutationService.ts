import mongoose from 'mongoose';
import { getUserConnection } from '../config/db';
import { ListingSubmissionPolicy } from './ListingSubmissionPolicy';
import { processImages } from '../utils/imageProcessor';
import { sanitizeStoredImageUrls, deleteFromS3Url } from '../utils/s3';
import logger from '../utils/logger';
import AdModel from '../models/Ad';

export interface BaseListingCreationContext {
    userId: string;
    listingType: string;
    listingId: string;
    adDoc: Record<string, unknown>;
}

export interface ImageProcessingOptions {
    images: unknown;
    s3FolderTarget: string;
}

/**
 * ListingMutationService (SSOT)
 * Extracts the duplicated mongoose transactions, atomic slot assignments, 
 * and S3 network requests out of the individual Service/SparePart controllers.
 */
export class ListingMutationService {
    
    /**
     * Reusable S3 Image pipeline.
     * Takes raw image arrays from Request payloads and strictly normalizes/uploads them.
     */
    static async processIncomingImages(options: ImageProcessingOptions): Promise<string[]> {
        const { images, s3FolderTarget } = options;
        if (!Array.isArray(images)) return [];
        
        const incomingImages = images
            .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
            .filter((entry) => entry.length > 0);

        if (incomingImages.length === 0) return [];

        const processed = await processImages(incomingImages, s3FolderTarget);
        const finalUrls = sanitizeStoredImageUrls(processed.map((item) => item.url));
        
        if (finalUrls.length === 0) {
            throw Object.assign(new Error('Image upload failed. Please retry.'), { statusCode: 502 });
        }
        
        return finalUrls;
    }

    /**
     * Executes the identical MongoDB transaction required to insert a new Listing.
     * Guaranteed atomic: Reserves user slot quota and inserts the document simultaneously.
     */
    static async executeCreationTransaction(context: BaseListingCreationContext): Promise<Record<string, unknown>> {
        const dbSession = await getUserConnection().startSession();
        let createdListing: unknown;

        try {
            await dbSession.withTransaction(async () => {
                await ListingSubmissionPolicy.reserveSlot({
                    userId: context.userId,
                    listingType: context.listingType as any,
                    listingId: context.listingId,
                    session: dbSession,
                    actor: 'user',
                });
                
                const result = await AdModel.create([context.adDoc], { session: dbSession });
                createdListing = result[0];
            });
            
            return createdListing as Record<string, unknown>;
        } catch (error) {
            logger.error(`ListingMutationService: Failed to create ${context.listingType}`, { error });
            // Add context before throwing to preserve error details for callers
            const contextError = error instanceof Error ? error : new Error(String(error));
            contextError.message = `ListingMutationService: Failed to create ${context.listingType} - ${contextError.message}`;
            throw contextError;
        } finally {
            await dbSession.endSession();
        }
    }

    /**
     * Reusable S3 cleanup for removed images during updates.
     */
    static async cleanupRemovedImages(existingImages: unknown, newImages: unknown, entityId: string): Promise<void> {
        if (Array.isArray(newImages) && Array.isArray(existingImages)) {
            const nextImages = new Set(newImages.filter((img) => typeof img === 'string' && img.length > 0));
            const removedImages = existingImages.filter((img) => typeof img === 'string' && img && !nextImages.has(img));

            if (removedImages.length > 0) {
                await Promise.all(
                    removedImages.map(async (url) => {
                        try {
                            await deleteFromS3Url(url);
                        } catch (cleanupError) {
                            logger.warn('ListingMutationService: Failed to cleanup removed image', {
                                entityId,
                                imageUrl: url,
                                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
                            });
                        }
                    })
                );
            }
        }
    }
}
