import { OpsCommand, OpsExecutionContext, OpsCommandResult } from '../../../types';
import Brand from '../../../models/Brand';
import Category from '../../../models/Category';
import { CATALOG_STATUS, CatalogStatusValue } from '../../../constants/enums/catalogStatus';
import { connectDB } from '../../../config/db';

export const catalogNormalizationCommand: OpsCommand = {
    name: 'catalog-normalize',
    description: 'Normalizes legacy catalog statuses and repairs broken relations',
    blastRadius: 'medium',
    run: async (context: OpsExecutionContext): Promise<OpsCommandResult> => {
        const { emit, flags } = context;
        emit('ops.info', { message: '🚀 Starting Catalog Normalization...' });

        // Ensure DB is connected
        await connectDB();

        const summary: Record<string, unknown> = {
            categoriesUpdated: 0,
            brandsUpdated: 0,
            brokenBrandsFound: 0
        };

        if (!flags.apply) {
            emit('ops.info', { message: '🔍 DRY RUN: No changes will be applied.' });
        }

        // 1. Normalize Category Statuses
        emit('ops.info', { message: '📦 Checking Category statuses...' });
        const categoriesToUpdate = await Category.countDocuments({ status: 'active' as CatalogStatusValue, isDeleted: false });
        
        if (flags.apply && categoriesToUpdate > 0) {
            const result = await Category.updateMany(
                { status: 'active' as CatalogStatusValue, isDeleted: false },
                { $set: { status: CATALOG_STATUS.LIVE } }
            );
            summary.categoriesUpdated = result.modifiedCount;
            emit('ops.info', { message: `✅ Updated ${result.modifiedCount} categories.` });
        } else {
            summary.categoriesPendingUpdate = categoriesToUpdate;
            emit('ops.info', { message: `ℹ️ ${categoriesToUpdate} categories need normalization.` });
        }

        // 2. Normalize Brand Statuses
        emit('ops.info', { message: '📦 Checking Brand statuses...' });
        const brandsToUpdate = await Brand.countDocuments({ status: 'active' as CatalogStatusValue, isDeleted: false });

        if (flags.apply && brandsToUpdate > 0) {
            const result = await Brand.updateMany(
                { status: 'active' as CatalogStatusValue, isDeleted: false },
                { $set: { status: CATALOG_STATUS.LIVE } }
            );
            summary.brandsUpdated = result.modifiedCount;
            emit('ops.info', { message: `✅ Updated ${result.modifiedCount} brands.` });
        } else {
            summary.brandsPendingUpdate = brandsToUpdate;
            emit('ops.info', { message: `ℹ️ ${brandsToUpdate} brands need normalization.` });
        }

        // 3. Identify Broken Relations
        emit('ops.info', { message: '🔍 Checking for brands with missing categoryIds...' });
        const brokenBrands = await Brand.find({
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } },
                { categoryIds: null }
            ],
            isDeleted: false
        }).select('name _id');

        summary.brokenBrandsFound = brokenBrands.length;
        if (brokenBrands.length > 0) {
            emit('ops.warn', { 
                message: `⚠️ Found ${brokenBrands.length} brands with missing categoryIds`,
                brands: brokenBrands.map((b: { name: string; _id: unknown }) => ({ name: b.name, id: String(b._id) }))
            });
        } else {
            emit('ops.info', { message: '✅ No brands with missing categoryIds found.' });
        }

        return {
            summary,
            rollbackGuidance: [
                'To revert status changes, manually update categories/brands back to status: "active".',
                'Status normalization is generally safe and recommended for backward compatibility.'
            ]
        };
    }
};
