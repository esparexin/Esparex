import logger from './logger';
import Category from '../models/Category';
import Brand from '../models/Brand';
import ProductModel from '../models/Model';

/**
 * Validates the integrity of metadata collections at startup.
 * Since metadata (Categories, Brands) often resides in a separate Admin DB,
 * this check ensures that the application is correctly connected and the data is present.
 */
export async function validateMetadataHealth() {
    try {
        const [categoryCount, brandCount, modelCount] = await Promise.all([
            Category.countDocuments(),
            Brand.countDocuments(),
            ProductModel.countDocuments()
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
