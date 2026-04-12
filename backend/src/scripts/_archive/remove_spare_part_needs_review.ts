import mongoose from 'mongoose';
import { connectDB } from '../../config/db';
import SparePart from '../../models/SparePart';
import logger from '../../utils/logger';

type ScriptMode = 'dry-run' | 'apply';

const isApply = process.argv.includes('--apply');

async function removeSparePartNeedsReview() {
    const mode: ScriptMode = isApply ? 'apply' : 'dry-run';

    try {
        logger.info('[SparePartNeedsReviewCleanup] Starting', { mode });
        await connectDB();

        const collection = SparePart.collection;
        const filter = {
            isDeleted: { $ne: true },
            needsReview: { $exists: true },
        };

        const docs = await collection
            .find(filter, { projection: { _id: 1, name: 1, needsReview: 1, isActive: 1, categoryIds: 1 } })
            .toArray();

        const samples = docs.slice(0, 20).map((doc) => ({
            id: String(doc._id),
            name: typeof doc.name === 'string' ? doc.name : '',
            needsReview: doc.needsReview ?? null,
            isActive: doc.isActive ?? null,
            categoryIds: Array.isArray(doc.categoryIds) ? doc.categoryIds.map(String) : [],
        }));

        let updated = 0;
        if (isApply && docs.length > 0) {
            const result = await collection.updateMany(filter, { $unset: { needsReview: 1 } });
            updated = result.modifiedCount;
        }

        logger.info('[SparePartNeedsReviewCleanup] Summary', {
            mode,
            scanned: docs.length,
            wouldUpdate: docs.length,
            updated,
            samples,
        });

        if (!isApply && docs.length > 0) {
            logger.info('[SparePartNeedsReviewCleanup] Re-run with --apply to commit changes');
        }
    } catch (error) {
        logger.error('[SparePartNeedsReviewCleanup] Failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    void removeSparePartNeedsReview();
}

export default removeSparePartNeedsReview;
