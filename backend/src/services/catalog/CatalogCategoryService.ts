/**
 * CatalogCategoryService
 * DB operations for Category management.
 * Also owns the multi-model entity count query used by the admin dashboard.
 */

import type { ClientSession, Model as MongooseModel } from 'mongoose';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import CatalogModel from '../../models/Model';
import SparePart from '../../models/SparePart';
import ServiceType from '../../models/ServiceType';
import ScreenSize from '../../models/ScreenSize';
import logger from '../../utils/logger';

// Re-export the Category model so controllers can pass it to generic handler
// utilities (handlePaginatedContent, handleCatalogToggleStatus) without importing
// from models/ directly.
export { default as CategoryModel } from '../../models/Category';

// ─── Catalog-wide counts ──────────────────────────────────────────────────────

const CATALOG_COUNT_MAX_TIME_MS = 1500;
const CATALOG_COUNT_ESTIMATE_MAX_TIME_MS = 1000;

async function countCatalogCollectionSafely(
    model: MongooseModel<unknown>,
    filter: Record<string, unknown>,
    hint?: Record<string, 1 | -1>
): Promise<number> {
    const modelName = model.modelName || 'Unknown';
    const countOptions: Record<string, unknown> = {
        maxTimeMS: CATALOG_COUNT_MAX_TIME_MS,
        ...(hint ? { hint } : {})
    };
    try {
        return await model.collection.countDocuments(filter, countOptions);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isHintError = Boolean(hint) && /hint|index/i.test(message);
        if (isHintError) {
            try {
                return await model.collection.countDocuments(filter, { maxTimeMS: CATALOG_COUNT_MAX_TIME_MS });
            } catch (retryError) {
                logger.warn('[CatalogCounts] countDocuments retry without hint failed; using estimate', {
                    model: modelName,
                    error: retryError instanceof Error ? retryError.message : String(retryError)
                });
            }
        } else {
            logger.warn('[CatalogCounts] countDocuments failed; using estimate', { model: modelName, error: message });
        }
        return model.collection.estimatedDocumentCount({ maxTimeMS: CATALOG_COUNT_ESTIMATE_MAX_TIME_MS });
    }
}

export async function getCatalogEntityCounts() {
    const nonDeletedFilter = { isDeleted: { $ne: true } };
    const [categories, brands, models, spareParts, serviceTypes, screenSizes] = await Promise.all([
        countCatalogCollectionSafely(Category, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(Brand, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(CatalogModel, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(SparePart, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(ServiceType, nonDeletedFilter, { isDeleted: 1 }),
        countCatalogCollectionSafely(ScreenSize, nonDeletedFilter, { isDeleted: 1 })
    ]);
    return { categories, brands, models, spareParts, serviceTypes, screenSizes };
}

// ─── Category queries ─────────────────────────────────────────────────────────

export const findCategoryById = async (id: string | undefined) => {
    if (!id) return null;
    return Category.findById(id);
};

export const categoryParentExists = async (parentId: string | undefined) => {
    if (!parentId) return false;
    return Category.exists({ _id: parentId });
};

export const updateCategorySchemaById = async (id: string | undefined, filters: unknown[]) => {
    if (!id) return null;
    return Category.findByIdAndUpdate(id, { filters }, { new: true, runValidators: true });
};

export const findCategoryByIdWithSession = async (id: string | undefined, session: ClientSession) => {
    if (!id) return null;
    return Category.findById(id).session(session);
};

export const softDeleteCategoryById = async (id: string | { toString(): string }, session: ClientSession) =>
    Category.updateOne(
        { _id: id },
        { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } },
        { session }
    );
