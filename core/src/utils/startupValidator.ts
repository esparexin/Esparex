import logger from './logger';
import Category from '../models/Category';
import Brand from '../models/Brand';
import ProductModel from '../models/Model';
import type { Model as MongooseModel } from 'mongoose';

const STARTUP_COUNT_MAX_TIME_MS = 1200;

const getFastCollectionCount = async (model: MongooseModel<unknown>): Promise<number> => {
    try {
        return await model.collection.estimatedDocumentCount({
            maxTimeMS: STARTUP_COUNT_MAX_TIME_MS
        });
    } catch (estimateError) {
        const modelName = model.modelName || 'Unknown';
        logger.warn('[MetadataHealth] estimatedDocumentCount failed; falling back to countDocuments', {
            model: modelName,
            error: estimateError instanceof Error ? estimateError.message : String(estimateError)
        });

        return model.collection.countDocuments({}, {
            maxTimeMS: STARTUP_COUNT_MAX_TIME_MS
        });
    }
};

/**
 * Validates the integrity of metadata collections at startup.
 * Since metadata (Categories, Brands) often resides in a separate Admin DB,
 * this check ensures that the application is correctly connected and the data is present.
 */
export async function validateMetadataHealth() {
    try {
        const [categoryCount, brandCount, modelCount] = await Promise.all([
            getFastCollectionCount(Category),
            getFastCollectionCount(Brand),
            getFastCollectionCount(ProductModel)
        ]);

        if (categoryCount === 0 || brandCount === 0) {
            logger.warn('⚠️ METADATA ALERT: Category or Brand collection is empty. Listings may lack critical metadata.', {
                categories: categoryCount,
                brands: brandCount,
                models: modelCount
            });
        } else {
            logger.info('✅ Metadata health verified', {
                categories: categoryCount,
                brands: brandCount,
                models: modelCount
            });
        }
    } catch (err) {
        logger.error('❌ Metadata validation failed', {
            error: err instanceof Error ? err.message : String(err)
        });
    }
}
