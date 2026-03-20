import Ad from '../models/Ad';
import SparePart from '../models/SparePart';
import Brand from '../models/Brand';
import logger from '../utils/logger';
import { connectDB } from '../config/db';

/**
 * Data Backfill Script: sparePartsSnapshot
 * 
 * Denormalizes spare part metadata into existing ads for improved listing performance.
 */
export const backfillSparePartsSnapshot = async () => {
    logger.info('Starting sparePartsSnapshot backfill script');
    await connectDB();
    
    const batchSize = 100;
    let processedCount = 0;
    let updatedCount = 0;

    // Fetch only Ads that have sparePartIds but no snapshot
    const adsToUpdate = await Ad.find({
        sparePartIds: { $exists: true, $not: { $size: 0 } },
        $or: [
            { sparePartsSnapshot: { $exists: false } },
            { sparePartsSnapshot: { $size: 0 } }
        ]
    }).select('_id sparePartIds').lean();

    logger.info(`Found ${adsToUpdate.length} ads requiring backfill`);

    for (let i = 0; i < adsToUpdate.length; i += batchSize) {
        const batch = adsToUpdate.slice(i, i + batchSize);
        
        // Collect all unique spare part IDs in this batch to minimize DB calls
        const sparePartIds = Array.from(new Set(batch.flatMap(ad => (ad as any).sparePartIds || [])));
        if (sparePartIds.length === 0) continue;

        const validParts = await SparePart.find({ _id: { $in: sparePartIds } }).select('_id name brandId').lean();
        const brandIds = Array.from(new Set(validParts.map(p => p.brandId).filter(Boolean)));
        const brands = await (Brand as any).find({ _id: { $in: brandIds } }).select('_id name').lean();
        
        const brandMap = new Map(brands.map((b: any) => [String(b._id), b.name]));
        const partMap = new Map(validParts.map(p => [String(p._id), p]));

        const updatePromises = batch.map(async (ad: any) => {
            if (!ad.sparePartIds) return false;

            const snapshot = ad.sparePartIds
                .map((id: string) => partMap.get(String(id)))
                .filter((p: any): p is any => Boolean(p))
                .map((part: any) => ({
                    _id: part._id,
                    name: part.name,
                    brand: part.brandId ? brandMap.get(String(part.brandId)) : undefined
                }));

            if (snapshot.length > 0) {
                await Ad.updateOne({ _id: ad._id }, { $set: { sparePartsSnapshot: snapshot } });
                return true;
            }
            return false;
        });

        const results = await Promise.all(updatePromises);
        updatedCount += results.filter(Boolean).length;
        processedCount += batch.length;
        
        logger.info(`Progress: ${processedCount}/${adsToUpdate.length} ads processed, ${updatedCount} snapshots updated`);
    }

    logger.info('Backfill completed successfully', { totalProcessed: processedCount, totalUpdated: updatedCount });
};

if (require.main === module) {
    backfillSparePartsSnapshot()
        .then(() => {
            logger.info('Script finished successfully');
            process.exit(0);
        })
        .catch((err) => {
            logger.error('Backfill script failed', { 
                error: err instanceof Error ? err.message : String(err) 
            });
            process.exit(1);
        });
}
