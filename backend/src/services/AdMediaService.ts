import { ClientSession } from 'mongoose';
import * as adImageService from './AdImageService';
import logger from '../utils/logger';

export interface ImageMeta {
    url: string;
    hash: string;
}

/**
 * AdMediaService
 * Responsible for sanitizing, hashing, and uploading ad media.
 */
export class AdMediaService {
    /**
     * Process a batch of images for an ad.
     * Sanitizes, hashes, and uploads to S3.
     */
    static async processImages(
        adId: string,
        images: { buffer: Buffer; mimeType?: string }[],
        session?: ClientSession
    ): Promise<ImageMeta[]> {
        try {
            if (!images || images.length === 0) return [];

            const results = await adImageService.uploadMultipleImages(adId, images, session);
            
            return results.map(res => ({
                url: res.url,
                hash: res.hash
            }));
        } catch (error) {
            logger.error('AdMediaService: Failed to process images', { adId, error });
            throw error;
        }
    }

    /**
     * Delete all media associated with an ad.
     */
    static async deleteByAdId(adId: string, session?: ClientSession): Promise<void> {
        await adImageService.deleteAdImages(adId, session);
    }
}
