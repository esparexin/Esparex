import mongoose from 'mongoose';
import Category from '../models/Category';
import Model from '../models/Model';
import { getAdminConnection } from '../config/db';
import logger from '../utils/logger';

/**
 * Catalog Stabilization Migration
 * 1. Initialize Category.hasScreenSizes: false if missing
 * 2. Backfill Model.categoryIds from Model.categoryId
 */
export async function runCatalogStabilizationMigration() {
    logger.info('Starting Catalog Stabilization Migration...');
    
    try {
        // 1. Categories: Initialize hasScreenSizes
        const categoryResult = await Category.updateMany(
            { hasScreenSizes: { $exists: false } },
            { $set: { hasScreenSizes: false } }
        );
        logger.info(`Updated ${categoryResult.modifiedCount} categories with hasScreenSizes: false`);

        // 2. Models: Backfill categoryIds array
        const modelsToFix = await Model.find({
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } }
            ],
            categoryId: { $exists: true, $ne: null }
        });

        let modelUpdateCount = 0;
        for (const model of modelsToFix) {
            await Model.updateOne(
                { _id: model._id },
                { $set: { categoryIds: [model.categoryId] } }
            );
            modelUpdateCount++;
        }
        logger.info(`Backfilled categoryIds for ${modelUpdateCount} models`);

        logger.info('Catalog Stabilization Migration completed successfully.');
    } catch (error) {
        logger.error('Catalog Stabilization Migration failed', { error });
        throw error;
    }
}

// If run directly
if (require.main === module) {
    (async () => {
        try {
            await runCatalogStabilizationMigration();
            process.exit(0);
        } catch (err) {
            process.exit(1);
        }
    })();
}
