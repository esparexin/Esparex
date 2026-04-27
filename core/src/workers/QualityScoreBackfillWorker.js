"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQualityScoreBackfill = void 0;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const adQualityScorer_1 = require("@core/utils/adQualityScorer");
/**
 * Lazy Quality Score Backfill Worker
 * Enriches legacy ads where `listingQualityScore` is `0` or `null`
 * Runs periodically (e.g. cron schedule via BullMQ)
 */
const runQualityScoreBackfill = async () => {
    logger_1.default.info('Starting QualityScoreBackfill Worker...');
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
        const adsToProcess = await Ad_1.default.find(query)
            .sort({ createdAt: -1 }) // Newest live listings first
            .limit(500)
            .select('title description images brandId price location listingQualityScore status')
            .lean();
        if (!adsToProcess || adsToProcess.length === 0) {
            logger_1.default.info('QualityScoreBackfill Worker finished: No eligible ads found.');
            return;
        }
        logger_1.default.info(`QualityScoreBackfill Worker found ${adsToProcess.length} ads to process.`);
        const bulkOperations = adsToProcess.map((ad) => {
            const score = (0, adQualityScorer_1.computeListingQualityScore)({
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
            const result = await Ad_1.default.bulkWrite(bulkOperations, { ordered: false });
            logger_1.default.info('QualityScoreBackfill Worker batch complete', {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error in QualityScoreBackfill Worker', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.runQualityScoreBackfill = runQualityScoreBackfill;
//# sourceMappingURL=QualityScoreBackfillWorker.js.map