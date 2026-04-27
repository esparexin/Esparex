"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingMutationService = void 0;
const imageProcessor_1 = require("@core/utils/imageProcessor");
const s3_1 = require("@core/utils/s3");
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * ListingMutationService (SSOT)
 * Extracts the duplicated mongoose transactions, atomic slot assignments,
 * and S3 network requests out of the individual Service/SparePart controllers.
 */
class ListingMutationService {
    /**
     * Reusable S3 Image pipeline.
     * Takes raw image arrays from Request payloads and strictly normalizes/uploads them.
     */
    static async processIncomingImages(options) {
        const { images, s3FolderTarget } = options;
        if (!Array.isArray(images))
            return [];
        const incomingImages = images
            .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
            .filter((entry) => entry.length > 0);
        if (incomingImages.length === 0)
            return [];
        const processed = await (0, imageProcessor_1.processImages)(incomingImages, s3FolderTarget);
        const finalUrls = (0, s3_1.sanitizeStoredImageUrls)(processed.map((item) => item.url));
        if (finalUrls.length === 0) {
            throw Object.assign(new Error('Image upload failed. Please retry.'), { statusCode: 502 });
        }
        return finalUrls;
    }
    /**
     * Reusable S3 cleanup for removed images during updates.
     */
    static async cleanupRemovedImages(existingImages, newImages, entityId) {
        if (Array.isArray(newImages) && Array.isArray(existingImages)) {
            const nextImgs = newImages.filter((img) => typeof img === 'string' && img.length > 0);
            const nextImages = new Set(nextImgs);
            const removedImages = existingImages.filter((img) => typeof img === 'string' && Boolean(img) && !nextImages.has(img));
            if (removedImages.length > 0) {
                await Promise.all(removedImages.map(async (url) => {
                    try {
                        await (0, s3_1.deleteFromS3Url)(url);
                    }
                    catch (cleanupError) {
                        logger_1.default.warn('ListingMutationService: Failed to cleanup removed image', {
                            entityId,
                            imageUrl: url,
                            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
                        });
                    }
                }));
            }
        }
    }
}
exports.ListingMutationService = ListingMutationService;
//# sourceMappingURL=ListingMutationService.js.map