import mongoose from 'mongoose';
import { getUserConnection } from '../config/db';
import logger from '../utils/logger';

/**
 * MANUAL INDEX MIGRATION SCRIPT
 * Resolves name collisions caused by auto-generated index names.
 */
export async function migrateIndexes() {
    logger.info('Starting manual index migration for Ad collection...');
    
    const db = getUserConnection();
    const Ad = db.collection('ads');
    
    try {
        const indexes = await Ad.indexes();
        logger.info(`Found ${indexes.length} existing indexes.`);

        // 🔥 HARD RESET: Drop ALL non-internal indexes
        for (const index of indexes) {
            const { name } = index;
            if (!name || name === '_id_') continue;

            logger.warn(`Dropping index for hard reset: ${name}`);
            await Ad.dropIndex(name);
            logger.info(`Index ${name} dropped.`);
        }

        logger.info('Index migration check complete.');
    } catch (error) {
        logger.error('Index migration failed', { error });
        throw error;
    }
}

// If run directly
if (require.main === module) {
    const { connectDB } = require('../config/db');
    connectDB().then(() => {
        migrateIndexes().then(() => {
            logger.info('Manual migration script finished.');
            process.exit(0);
        }).catch(err => {
            logger.error('Migration failed', err);
            process.exit(1);
        });
    });
}
