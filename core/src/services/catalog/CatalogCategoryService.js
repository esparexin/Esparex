"use strict";
/**
 * CatalogCategoryService
 * DB operations for Category management.
 * Also owns the multi-model entity count query used by the admin dashboard.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteCategoryById = exports.findCategoryByIdWithSession = exports.updateCategorySchemaById = exports.categoryParentExists = exports.findCategoryById = exports.CategoryModel = void 0;
exports.getCatalogEntityCounts = getCatalogEntityCounts;
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const SparePart_1 = __importDefault(require("@core/models/SparePart"));
const ServiceType_1 = __importDefault(require("@core/models/ServiceType"));
const ScreenSize_1 = __importDefault(require("@core/models/ScreenSize"));
const logger_1 = __importDefault(require("@core/utils/logger"));
// Re-export the Category model so controllers can pass it to generic handler
// utilities (handlePaginatedContent, handleCatalogToggleStatus) without importing
// from models/ directly.
var Category_2 = require("@core/models/Category");
Object.defineProperty(exports, "CategoryModel", { enumerable: true, get: function () { return __importDefault(Category_2).default; } });
// ─── Catalog-wide counts ──────────────────────────────────────────────────────
const CATALOG_COUNT_MAX_TIME_MS = 1500;
const CATALOG_COUNT_ESTIMATE_MAX_TIME_MS = 1000;
async function countCatalogCollectionSafely(model, filter, hint) {
    const modelName = model.modelName || 'Unknown';
    const countOptions = {
        maxTimeMS: CATALOG_COUNT_MAX_TIME_MS,
        ...(hint ? { hint } : {})
    };
    try {
        return await model.collection.countDocuments(filter, countOptions);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isHintError = Boolean(hint) && /hint|index/i.test(message);
        if (isHintError) {
            try {
                return await model.collection.countDocuments(filter, { maxTimeMS: CATALOG_COUNT_MAX_TIME_MS });
            }
            catch (retryError) {
                logger_1.default.warn('[CatalogCounts] countDocuments retry without hint failed; using estimate', {
                    model: modelName,
                    error: retryError instanceof Error ? retryError.message : String(retryError)
                });
            }
        }
        else {
            logger_1.default.warn('[CatalogCounts] countDocuments failed; using estimate', { model: modelName, error: message });
        }
        return model.collection.estimatedDocumentCount({ maxTimeMS: CATALOG_COUNT_ESTIMATE_MAX_TIME_MS });
    }
}
async function getCatalogEntityCounts() {
    const nonDeletedFilter = { isDeleted: { $ne: true } };
    const [categories, brands, models, spareParts, serviceTypes, screenSizes] = await Promise.all([
        countCatalogCollectionSafely(Category_1.default, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(Brand_1.default, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(Model_1.default, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(SparePart_1.default, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(ServiceType_1.default, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(ScreenSize_1.default, nonDeletedFilter, { isDeleted: 1 })
    ]);
    return { categories, brands, models, spareParts, serviceTypes, screenSizes };
}
// ─── Category queries ─────────────────────────────────────────────────────────
const findCategoryById = async (id) => {
    if (!id)
        return null;
    return Category_1.default.findById(id);
};
exports.findCategoryById = findCategoryById;
const categoryParentExists = async (parentId) => {
    if (!parentId)
        return false;
    return Category_1.default.exists({ _id: parentId });
};
exports.categoryParentExists = categoryParentExists;
const updateCategorySchemaById = async (id, filters) => {
    if (!id)
        return null;
    return Category_1.default.findByIdAndUpdate(id, { filters }, { new: true, runValidators: true });
};
exports.updateCategorySchemaById = updateCategorySchemaById;
const findCategoryByIdWithSession = async (id, session) => {
    if (!id)
        return null;
    return Category_1.default.findById(id).session(session);
};
exports.findCategoryByIdWithSession = findCategoryByIdWithSession;
const softDeleteCategoryById = async (id, session) => Category_1.default.updateOne({ _id: id }, { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }, { session });
exports.softDeleteCategoryById = softDeleteCategoryById;
//# sourceMappingURL=CatalogCategoryService.js.map