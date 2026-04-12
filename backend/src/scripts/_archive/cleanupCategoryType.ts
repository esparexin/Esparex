import mongoose from 'mongoose';
import { getAdminConnection } from '../../config/db';
import Category from '../../models/Category';
import logger from '../../utils/logger';

/**
 * cleanupCategoryType
 * 
 * The final step in the Capability-Driven Migration.
 * 1. Unsets the `type` field from all Category documents.
 * 2. Removes any remaining legacy query dependencies.
 */
async function cleanupCategoryType() {
    try {
        const db = getAdminConnection();
        logger.info('Starting Category.type DEPLETION (Final Unset)...');

        // 1. Unset the field
        const result = await Category.updateMany(
            {}, 
            { $unset: { type: 1 } }
        );

        logger.info(`Field "type" unset from ${result.modifiedCount} categories.`);

        // 2. Index Cleanup
        // Note: idx_category_type_active might still exist.
        // We handle this via Mongoose schema sync or manual drop if needed.
        const indexes = await Category.collection.listIndexes().toArray();
        const typeIndex = indexes.find(idx => idx.name === 'idx_category_type_active' || idx.key.type);
        
        if (typeIndex) {
            await Category.collection.dropIndex(typeIndex.name);
            logger.info(`Dropped index: ${typeIndex.name}`);
        }

        logger.info('Depletion Completed successfully.');

    } catch (error) {
        logger.error('Depletion Failed:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    cleanupCategoryType().then(() => mongoose.disconnect());
}

export default cleanupCategoryType;
