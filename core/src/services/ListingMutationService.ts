import { processImages } from '../utils/imageProcessor';
import { sanitizeStoredImageUrls, deleteFromS3Url } from '../infrastructure/storage/s3';
import logger from '../utils/logger';

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
     * Reusable S3 cleanup for removed images during updates.
     */
    static async cleanupRemovedImages(existingImages: unknown, newImages: unknown, entityId: string): Promise<void> {
        if (Array.isArray(newImages) && Array.isArray(existingImages)) {
            const nextImgs = (newImages as unknown[]).filter((img): img is string => typeof img === 'string' && img.length > 0);
            const nextImages = new Set(nextImgs);
            const removedImages = (existingImages as unknown[]).filter((img): img is string => typeof img === 'string' && Boolean(img) && !nextImages.has(img));

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
