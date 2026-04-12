import mongoose from 'mongoose';
import { getAdminConnection } from '../../config/db';
import Model from '../../models/Model';
import Brand from '../../models/Brand';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import logger from '../../utils/logger';

/**
 * Migration: Normalize Catalog Statuses
 * 
 * Objective: 
 * 1. Move all 'live' statuses to 'active' (canonical).
 * 2. Ensure all 'active' items have isActive: true.
 * 3. Ensure all 'pending' items have isActive: false.
 */

async function run() {
    try {
        const adminConn = getAdminConnection();
        
        // Wait for connection to be ready
        if (adminConn.readyState !== 1) {
            logger.info('[Migration] Waiting for DB connection...');
            await new Promise((resolve) => {
                adminConn.once('open', resolve);
                // In case it opened already before the listener was attached
                if (adminConn.readyState === 1) resolve(true);
            });
        }
        
        logger.info('[Migration] Starting Catalog Status Normalization...');

        // 1. Models Normalization
        const modelResults = await Model.updateMany(
            { status: 'live' },
            { $set: { status: CATALOG_STATUS.ACTIVE, isActive: true } }
        );
        logger.info('[Migration] Models normalized (live -> active)', { modified: modelResults.modifiedCount });


        const modelActiveResults = await Model.updateMany(
            { status: CATALOG_STATUS.ACTIVE },
            { $set: { isActive: true } }
        );
        logger.info('[Migration] Models active state verified', { modified: modelActiveResults.modifiedCount });

        // 2. Brands Normalization
        const brandResults = await Brand.updateMany(
            { status: 'live' },
            { $set: { status: CATALOG_STATUS.ACTIVE, isActive: true } }
        );
        logger.info('[Migration] Brands normalized (live -> active)', { modified: brandResults.modifiedCount });

        const brandActiveResults = await Brand.updateMany(
            { status: CATALOG_STATUS.ACTIVE },
            { $set: { isActive: true } }
        );
        logger.info('[Migration] Brands active state verified', { modified: brandActiveResults.modifiedCount });

        // 3. Fix Null Statuses
        const brandNullResults = await Brand.updateMany(
            { status: { $exists: false } },
            { $set: { status: CATALOG_STATUS.ACTIVE, isActive: true } }
        );
        logger.info('[Migration] Brands with null status repaired', { modified: brandNullResults.modifiedCount });

        logger.info('[Migration] Catalog Normalization Complete.');
    } catch (error) {
        logger.error('[Migration] Failed to normalize catalog:', error);
        process.exit(1);
    }
}

run().then(() => {
    logger.info('[Migration] Process finished.');
    process.exit(0);
});
