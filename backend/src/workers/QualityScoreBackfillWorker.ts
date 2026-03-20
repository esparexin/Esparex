import Ad from '../models/Ad';
import logger from '../utils/logger';
import { computeListingQualityScore } from '../utils/adQualityScorer';

/**
 * Lazy Quality Score Backfill Worker
 * Enriches legacy ads where `listingQualityScore` is `0` or `null`
 * Runs periodically (e.g. cron schedule via BullMQ)
 */
export const runQualityScoreBackfill = async (): Promise<void> => {
    logger.info('Starting QualityScoreBackfill Worker...');

    try {
        // Query condition: status is live/pending, and listingQualityScore is missing or 0
        const query = {
            status: { $in: ['live', 'pending'] },
            $or: [
                { listingQualityScore: { $exists: false } },
                { listingQualityScore: null },
                { listingQualityScore: 0 }
            ]
        };

        // Process a small batch to avoid locking
        const adsToProcess = await Ad.find(query)
            .sort({ createdAt: -1 }) // Newest live listings first
            .limit(500)
            .select('title description images brandId price location listingQualityScore status');

        if (!adsToProcess || adsToProcess.length === 0) {
            logger.info('QualityScoreBackfill Worker finished: No eligible ads found.');
            return;
        }

        logger.info(`QualityScoreBackfill Worker found ${adsToProcess.length} ads to process.`);

        const bulkOperations = adsToProcess.map((ad: any) => {
            const score = computeListingQualityScore({
                title: ad.title,
                description: ad.description,
                images: ad.images,
                brandId: ad.brandId,
                price: ad.price,
                location: ad.location,
            });

            return {
                updateOne: {
                    filter: { _id: ad._id },
                    update: { $set: { listingQualityScore: score } }
                }
            };
        });

        if (bulkOperations.length > 0) {
            const result = await Ad.bulkWrite(bulkOperations, { ordered: false });
            logger.info('QualityScoreBackfill Worker batch complete', {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            });
        }
    } catch (error) {
        logger.error('Error in QualityScoreBackfill Worker', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
