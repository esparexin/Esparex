'use strict';

module.exports = {
    async up(db) {
        console.log('🚀 [Recovery Migration] Starting master catalog restoration...');

        // 1. Log before counts
        const beforeCategories = await db.collection('categories').countDocuments({});
        const beforeActiveCategories = await db.collection('categories').countDocuments({ isDeleted: false, isActive: true });
        const beforeBrands = await db.collection('brands').countDocuments({});
        const beforeActiveBrands = await db.collection('brands').countDocuments({ isDeleted: false, isActive: true, approvalStatus: 'approved' });
        const beforeModels = await db.collection('models').countDocuments({});
        const beforeActiveModels = await db.collection('models').countDocuments({ isDeleted: false, isActive: true, approvalStatus: 'approved' });

        console.log(`📊 [Recovery Migration] Before Counts:
- Categories: Total = ${beforeCategories}, Active/Approved = ${beforeActiveCategories}
- Brands: Total = ${beforeBrands}, Active/Approved = ${beforeActiveBrands}
- Models: Total = ${beforeModels}, Active/Approved = ${beforeActiveModels}`);

        // 2. Restore all soft-deleted brands marked with archivedInCleanup = true
        const restoreBrandsResult = await db.collection('brands').updateMany(
            { archivedInCleanup: true, isDeleted: true },
            {
                $set: {
                    isDeleted: false,
                    isActive: true,
                    approvalStatus: 'approved',
                    restoredByRecovery: true // Track restored records for safe rollback
                },
                $unset: {
                    archivedInCleanup: '',
                    deletedAt: ''
                }
            }
        );
        console.log(`🔄 [Recovery Migration] Restored ${restoreBrandsResult.modifiedCount} brands marked as archivedInCleanup`);

        // 3. Approve and activate Apple, Samsung, BlackBerry
        const activateBrandsResult = await db.collection('brands').updateMany(
            {
                name: { $in: ['Apple', 'Samsung', 'BlackBerry'] }
            },
            {
                $set: {
                    isDeleted: false,
                    isActive: true,
                    approvalStatus: 'approved'
                },
                $unset: {
                    rejectionReason: '',
                    deletedAt: ''
                }
            }
        );
        console.log(`🔄 [Recovery Migration] Approved and activated Apple, Samsung, and BlackBerry (Modified: ${activateBrandsResult.modifiedCount})`);

        // 4. Synchronize categoryId and categoryIds on ALL brands
        // If categoryId exists but categoryIds is missing or empty, backfill categoryIds = [categoryId]
        const brandsWithSingularOnly = await db.collection('brands').find({
            categoryId: { $exists: true, $ne: null },
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } },
                { categoryIds: null }
            ]
        }).toArray();

        for (const brand of brandsWithSingularOnly) {
            await db.collection('brands').updateOne(
                { _id: brand._id },
                { $set: { categoryIds: [brand.categoryId] } }
            );
        }
        console.log(`🔄 [Recovery Migration] Synchronized categoryIds (plural array) on ${brandsWithSingularOnly.length} brands`);

        // If categoryIds exists but categoryId is missing, backfill categoryId = categoryIds[0]
        const brandsWithPluralOnly = await db.collection('brands').find({
            categoryId: { $exists: false },
            categoryIds: { $exists: true, $not: { $size: 0 }, $ne: null }
        }).toArray();

        for (const brand of brandsWithPluralOnly) {
            await db.collection('brands').updateOne(
                { _id: brand._id },
                { $set: { categoryId: brand.categoryIds[0] } }
            );
        }
        console.log(`🔄 [Recovery Migration] Synchronized categoryId (singular) on ${brandsWithPluralOnly.length} brands`);

        // 5. Synchronize categoryId and categoryIds on ALL models
        // If categoryId exists but categoryIds is missing or empty, backfill categoryIds = [categoryId]
        const modelsWithSingularOnly = await db.collection('models').find({
            categoryId: { $exists: true, $ne: null },
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } },
                { categoryIds: null }
            ]
        }).toArray();

        for (const model of modelsWithSingularOnly) {
            await db.collection('models').updateOne(
                { _id: model._id },
                { $set: { categoryIds: [model.categoryId] } }
            );
        }
        console.log(`🔄 [Recovery Migration] Synchronized categoryIds (plural array) on ${modelsWithSingularOnly.length} models`);

        // If categoryIds exists but categoryId is missing, backfill categoryId = categoryIds[0]
        const modelsWithPluralOnly = await db.collection('models').find({
            categoryId: { $exists: false },
            categoryIds: { $exists: true, $not: { $size: 0 }, $ne: null }
        }).toArray();

        for (const model of modelsWithPluralOnly) {
            await db.collection('models').updateOne(
                { _id: model._id },
                { $set: { categoryId: model.categoryIds[0] } }
            );
        }
        console.log(`🔄 [Recovery Migration] Synchronized categoryId (singular) on ${modelsWithPluralOnly.length} models`);

        // 6. Ensure all models of restored/active brands are approved and active
        const activeBrands = await db.collection('brands').find({ isDeleted: false, isActive: true, approvalStatus: 'approved' }).toArray();
        const activeBrandIds = activeBrands.map(b => b._id);

        const activateModelsResult = await db.collection('models').updateMany(
            {
                brandId: { $in: activeBrandIds },
                isDeleted: false
            },
            {
                $set: {
                    isActive: true,
                    approvalStatus: 'approved'
                }
            }
        );
        console.log(`🔄 [Recovery Migration] Activated ${activateModelsResult.modifiedCount} models for active/restored brands`);

        // 7. Restore any soft-deleted categories required by active brands/models
        // Collect all referenced category IDs from active brands and active models
        const referencedCategoryIdsSet = new Set();
        for (const brand of activeBrands) {
            if (brand.categoryId) referencedCategoryIdsSet.add(brand.categoryId.toString());
            if (brand.categoryIds) {
                brand.categoryIds.forEach(id => referencedCategoryIdsSet.add(id.toString()));
            }
        }

        const activeModels = await db.collection('models').find({ brandId: { $in: activeBrandIds }, isDeleted: false }).toArray();
        for (const model of activeModels) {
            if (model.categoryId) referencedCategoryIdsSet.add(model.categoryId.toString());
            if (model.categoryIds) {
                model.categoryIds.forEach(id => referencedCategoryIdsSet.add(id.toString()));
            }
        }

        const referencedCategoryIds = Array.from(referencedCategoryIdsSet).map(id => {
            try {
                return new (require('mongodb').ObjectId)(id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
            } catch (_) {
                return null;
            }
        }).filter(id => id !== null);

        if (referencedCategoryIds.length > 0) {
            const restoreCategoriesResult = await db.collection('categories').updateMany(
                {
                    _id: { $in: referencedCategoryIds },
                    isDeleted: true
                },
                {
                    $set: {
                        isDeleted: false,
                        isActive: true,
                        approvalStatus: 'approved',
                        restoredByRecovery: true
                    },
                    $unset: {
                        deletedAt: ''
                    }
                }
            );
            console.log(`🔄 [Recovery Migration] Restored ${restoreCategoriesResult.modifiedCount} referenced soft-deleted categories`);
        }

        // 8. Log after counts
        const afterCategories = await db.collection('categories').countDocuments({});
        const afterActiveCategories = await db.collection('categories').countDocuments({ isDeleted: false, isActive: true });
        const afterBrands = await db.collection('brands').countDocuments({});
        const afterActiveBrands = await db.collection('brands').countDocuments({ isDeleted: false, isActive: true, approvalStatus: 'approved' });
        const afterModels = await db.collection('models').countDocuments({});
        const afterActiveModels = await db.collection('models').countDocuments({ isDeleted: false, isActive: true, approvalStatus: 'approved' });

        console.log(`📊 [Recovery Migration] After Counts:
- Categories: Total = ${afterCategories}, Active/Approved = ${afterActiveCategories}
- Brands: Total = ${afterBrands}, Active/Approved = ${afterActiveBrands}
- Models: Total = ${afterModels}, Active/Approved = ${afterActiveModels}`);

        console.log('✅ [Recovery Migration] Master catalog restoration complete!');
    },

    async down(db) {
        console.log('🔄 [Recovery Migration] Rolling back master catalog restoration...');

        // 1. Re-delete brands that were restored
        const rollbackBrands = await db.collection('brands').updateMany(
            { restoredByRecovery: true },
            {
                $set: {
                    isDeleted: true,
                    isActive: false,
                    archivedInCleanup: true,
                    deletedAt: new Date()
                },
                $unset: {
                    restoredByRecovery: ''
                }
            }
        );
        console.log(`🔄 [Recovery Migration Rollback] Archived ${rollbackBrands.modifiedCount} previously restored brands`);

        // 2. Re-delete categories that were restored
        const rollbackCategories = await db.collection('categories').updateMany(
            { restoredByRecovery: true },
            {
                $set: {
                    isDeleted: true,
                    isActive: false,
                    deletedAt: new Date()
                },
                $unset: {
                    restoredByRecovery: ''
                }
            }
        );
        console.log(`🔄 [Recovery Migration Rollback] Archived ${rollbackCategories.modifiedCount} previously restored categories`);

        // Note: Apple, Samsung, BlackBerry are kept active during rollback as they are operational brands in active ads.
        console.log('✅ [Recovery Migration] Rollback completed successfully.');
    }
};
