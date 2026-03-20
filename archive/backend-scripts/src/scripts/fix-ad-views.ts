import { connectDB, getUserConnection } from '../config/db';
import logger from '../utils/logger';

async function fixViews() {
    await connectDB();
    const userDb = getUserConnection().db;
    if (!userDb) throw new Error("No DB");

    const adsCollection = userDb.collection('ads');

    // Find ads where unique > total
    const problematicAds = await adsCollection.find({
        $expr: { $gt: ["$views.unique", "$views.total"] }
    }).toArray();

    logger.info(`Found ${problematicAds.length} ads with inconsistent view counts (Unique > Total).`);

    for (const ad of problematicAds) {
        logger.info(`Fixing Ad ${ad._id}: Total ${ad.views.total} -> ${ad.views.unique}`);
        await adsCollection.updateOne(
            { _id: ad._id },
            { $set: { "views.total": ad.views.unique } }
        );
    }

    // Also fix ads where views is NOT an object (legacy cleanup from seeds)
    const legacyViews = await adsCollection.find({
        views: { $type: "number" }
    }).toArray();

    logger.info(`Found ${legacyViews.length} ads with legacy numeric views.`);
    for (const ad of legacyViews) {
        const val = Number(ad.views);
        await adsCollection.updateOne(
            { _id: ad._id },
            { $set: { views: { total: val, unique: Math.floor(val * 0.7), lastViewedAt: new Date() } } }
        );
    }

    logger.info("View counts harmonized.");
    process.exit(0);
}

fixViews().catch((error) => logger.error(error));
