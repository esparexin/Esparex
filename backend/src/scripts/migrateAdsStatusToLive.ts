import mongoose from 'mongoose';
import Ad from '../models/Ad';
import logger from '../utils/logger';
import { getUserConnection, connectDB } from '../config/db';

/**
 * Ad Status Migration: approved -> live
 * 
 * Safely transitions all active ads and their historical timeline entries
 * to the new 'live' canonical status.
 */
export const migrateAdsStatusToLive = async () => {
    logger.info('Starting Ad Status Migration: approved -> live');
    
    const db = getUserConnection();
    await connectDB();
    const session = await db.startSession();
    
    try {
        await session.withTransaction(async () => {
            // 1. Update Core Status field
            const statusUpdateResult = await Ad.updateMany(
                { status: 'approved' },
                { $set: { status: 'live' } },
                { session }
            );
            logger.info(`Migrated ${statusUpdateResult.modifiedCount} ads to status: 'live'`);

            // 2. Update Timeline History
            const timelineUpdateResult = await Ad.updateMany(
                { "timeline.status": "approved" },
                { $set: { "timeline.$[elem].status": "live" } },
                { 
                    arrayFilters: [{ "elem.status": "approved" }],
                    session 
                }
            );
            logger.info(`Updated ${timelineUpdateResult.modifiedCount} ad timeline history entries`);

            // 3. Verify No Stale 'approved' remain
            const leftoverCount = await Ad.countDocuments({ status: 'approved' }).session(session);
            if (leftoverCount > 0) {
                throw new Error(`Migration verification failed: ${leftoverCount} ads still have 'approved' status.`);
            }
        });
        
        logger.info('Ad Status Migration completed successfully');
    } catch (error) {
        logger.error('Ad Status Migration failed', { 
            error: error instanceof Error ? error.message : String(error) 
        });
        throw error;
    } finally {
        await session.endSession();
    }
};

// Auto-run if executed directly via ts-node
if (require.main === module) {
    migrateAdsStatusToLive()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
