type FilterQuery = Record<string, unknown>;
import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Model from '../models/Model';
import SparePart from '../models/SparePart';
import ServiceType from '../models/ServiceType';
import ScreenSize from '../models/ScreenSize';
import logger from '../utils/logger';

export interface MigrationStats {
    categoriesUpdated: number;
    brandsUpdated: number;
    modelsUpdated: number;
    sparePartsUpdated: number;
    serviceTypesUpdated: number;
    screenSizesUpdated: number;
}

/**
 * Idempotent migration that backfills missing or null `approvalStatus` fields
 * on catalog collections with `CATALOG_APPROVAL_STATUS.APPROVED`.
 */
export async function runCatalogApprovalStatusMigration(): Promise<MigrationStats> {
    const missingFilter: FilterQuery = {
        $or: [
            { approvalStatus: { $exists: false } },
            { approvalStatus: null },
            { approvalStatus: '' }
        ]
    };
    const updatePayload = {
        $set: { approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED }
    };

    const [catRes, brandRes, modelRes, spareRes, serviceRes, screenRes] = await Promise.all([
        Category.updateMany(missingFilter, updatePayload),
        Brand.updateMany(missingFilter, updatePayload),
        Model.updateMany(missingFilter, updatePayload),
        SparePart.updateMany(missingFilter, updatePayload),
        ServiceType.updateMany(missingFilter, updatePayload),
        ScreenSize.updateMany(missingFilter, updatePayload),
    ]);

    const stats: MigrationStats = {
        categoriesUpdated: catRes.modifiedCount || 0,
        brandsUpdated: brandRes.modifiedCount || 0,
        modelsUpdated: modelRes.modifiedCount || 0,
        sparePartsUpdated: spareRes.modifiedCount || 0,
        serviceTypesUpdated: serviceRes.modifiedCount || 0,
        screenSizesUpdated: screenRes.modifiedCount || 0,
    };

    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    if (total > 0) {
        logger.info('[Migration] Catalog approvalStatus backfill completed:', stats);
    } else {
        logger.debug('[Migration] Catalog approvalStatus already fully populated.');
    }

    return stats;
}
