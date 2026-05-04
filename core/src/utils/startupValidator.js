"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMetadataHealth = validateMetadataHealth;
const logger_1 = __importDefault(require("./logger"));
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const STARTUP_COUNT_MAX_TIME_MS = 1200;
const getFastCollectionCount = async (model) => {
    try {
        return await model.collection.estimatedDocumentCount({
            maxTimeMS: STARTUP_COUNT_MAX_TIME_MS
        });
    }
    catch (estimateError) {
        const modelName = model.modelName || 'Unknown';
        logger_1.default.warn('[MetadataHealth] estimatedDocumentCount failed; falling back to countDocuments', {
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
async function validateMetadataHealth() {
    try {
        const [categoryCount, brandCount, modelCount] = await Promise.all([
            getFastCollectionCount(Category_1.default),
            getFastCollectionCount(Brand_1.default),
            getFastCollectionCount(Model_1.default)
        ]);
        if (categoryCount === 0 || brandCount === 0) {
            logger_1.default.warn('⚠️ METADATA ALERT: Category or Brand collection is empty. Listings may lack critical metadata.', {
                categories: categoryCount,
                brands: brandCount,
                models: modelCount
            });
        }
        else {
            logger_1.default.info('✅ Metadata health verified', {
                categories: categoryCount,
                brands: brandCount,
                models: modelCount
            });
        }
    }
    catch (err) {
        logger_1.default.error('❌ Metadata validation failed', {
            error: err instanceof Error ? err.message : String(err)
        });
    }
}
//# sourceMappingURL=startupValidator.js.map