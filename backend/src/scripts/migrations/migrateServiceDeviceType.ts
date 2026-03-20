import mongoose from 'mongoose';
import { getUserConnection } from '../../config/db';
import AdModel from '../../models/Ad';
import Category from '../../models/Category';
import logger from '../../utils/logger';

/**
 * migrateServiceDeviceType
 * 
 * Ensures every Service document has a valid categoryId.
 * If categoryId is missing or invalid, attempts to resolve it using the legacy deviceType string.
 */
async function migrateServiceDeviceType() {
    try {
        const db = getUserConnection();
        logger.info('Starting Service.deviceType -> CategoryId normalization...');

        const services = await AdModel.find({ listingType: 'service' }).lean();
        logger.info(`Found ${services.length} services to audit.`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Cache categories for faster lookup
        const categories = await Category.find({ listingType: 'postservice' }).select('_id name').lean();
        const categoryByName = new Map(categories.map(c => [c.name.trim().toLowerCase(), c._id]));

        for (const service of services) {
            // Priority 1: categoryId already exists and is valid
            if (service.categoryId && mongoose.Types.ObjectId.isValid(service.categoryId.toString())) {
                skippedCount++;
                continue;
            }

            // Priority 2: Resolve from deviceType string
            if (service.deviceType) {
                const matchedId = categoryByName.get(service.deviceType.trim().toLowerCase());
                if (matchedId) {
                    await AdModel.updateOne(
                        { _id: service._id },
                        { $set: { categoryId: matchedId } }
                    );
                    updatedCount++;
                    logger.info(`Updated service ${service._id}: Resolved categoryId for "${service.deviceType}"`);
                } else {
                    errorCount++;
                    logger.warn(`Could not resolve category for service ${service._id} with deviceType: "${service.deviceType}"`);
                }
            } else {
                errorCount++;
                logger.error(`Service ${service._id} has no categoryId AND no deviceType!`);
            }
        }

        logger.info('Migration Completed.', {
            total: services.length,
            updated: updatedCount,
            skipped: skippedCount,
            errors: errorCount
        });

    } catch (error) {
        logger.error('Migration Failed:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    migrateServiceDeviceType().then(() => mongoose.disconnect());
}

export default migrateServiceDeviceType;
