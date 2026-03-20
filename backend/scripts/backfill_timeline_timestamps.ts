import { connectDB } from '../src/config/db';
import Ad from '../src/models/Ad';
import logger from '../src/utils/logger';

async function backfillTimelineTimestamps() {
    await connectDB();
    logger.info('Starting timeline timestamp backfill...');

    const adsWithBrokenTimeline = await Ad.find({
        'timeline': { $elemMatch: { timestamp: { $exists: false } } }
    });

    logger.info(`Found ${adsWithBrokenTimeline.length} ads with missing timeline timestamps.`);

    let fixedCount = 0;
    for (const ad of adsWithBrokenTimeline) {
        if (!ad.timeline) continue;
        let adModified = false;
        for (const entry of ad.timeline) {
            if (!entry.timestamp) {
                // Falls back to ad.createdAt or current date
                entry.timestamp = (ad as any).createdAt || new Date();
                adModified = true;
            }
        }

        if (adModified) {
            await ad.save();
            fixedCount++;
        }
    }

    logger.info(`Successfully fixed ${fixedCount} ads.`);
    process.exit(0);
}

backfillTimelineTimestamps().catch(err => {
    logger.error('Backfill failed', err);
    process.exit(1);
});
