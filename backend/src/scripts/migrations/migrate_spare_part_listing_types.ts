import mongoose from 'mongoose';
import { getAdminConnection } from '../../config/db';
import SparePart from '../../models/SparePart';
import logger from '../../utils/logger';

/**
 * migrateListingTypes
 * 
 * Maps legacy SparePart.type to the new listingType array.
 * PRIMARY -> ['postad'] (Visible in device ads)
 * SECONDARY -> ['postsparepart'] (Visible in inventory only)
 */
async function migrateListingTypes() {
    try {
        logger.info('Starting SparePart listingType migration...');
        
        // 1. Primary -> ['postad']
        const primaryResult = await SparePart.updateMany(
            { type: 'PRIMARY', listingType: { $exists: false } },
            { $set: { listingType: ['postad'] } }
        );
        logger.info(`Migrated ${primaryResult.modifiedCount} PRIMARY parts to ['postad']`);

        // 2. Secondary -> ['postsparepart']
        const secondaryResult = await SparePart.updateMany(
            { type: 'SECONDARY', listingType: { $exists: false } },
            { $set: { listingType: ['postsparepart'] } }
        );
        logger.info(`Migrated ${secondaryResult.modifiedCount} SECONDARY parts to ['postsparepart']`);

        // 3. Default for missing types
        const defaultResult = await SparePart.updateMany(
            { listingType: { $exists: false } },
            { $set: { listingType: ['postsparepart'] } }
        );
        logger.info(`Set default ['postsparepart'] for ${defaultResult.modifiedCount} parts`);

        logger.info('Migration successful.');
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    migrateListingTypes()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default migrateListingTypes;
