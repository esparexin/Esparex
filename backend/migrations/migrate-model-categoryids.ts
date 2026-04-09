import mongoose from 'mongoose';
import Model from '../src/models/Model';
import { getAdminConnection } from '../src/config/db';

/**
 * Migration: Consolidate categoryId → categoryIds
 * 
 * This migration ensures all models have categoryIds populated
 * from their legacy categoryId field.
 * 
 * Safe to run multiple times (idempotent).
 * 
 * Rollback: Run with --rollback flag (though not recommended)
 */
async function migrateModelCategoryIds(rollback = false) {
    const conn = getAdminConnection();
    await conn.connection;

    try {
        if (rollback) {
            console.log('🔄 Rolling back Model categoryId consolidation...');
            // Remove categoryIds, restore single categoryId
            await Model.updateMany(
                { categoryIds: { $exists: true, $ne: [] } },
                [{
                    $set: {
                        categoryId: { $arrayElemAt: ['$categoryIds', 0] }
                    }
                }]
            );
            console.log('✅ Rollback complete');
            return;
        }

        console.log('🚀 Starting Model categoryId → categoryIds migration...');

        // Step 1: Find all models with categoryId but empty/missing categoryIds
        const modelsWithLegacyId = await Model.find({
            categoryId: { $exists: true, $ne: null },
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } }
            ]
        }).select('_id categoryId categoryIds').lean();

        console.log(`📊 Found ${modelsWithLegacyId.length} models with legacy categoryId`);

        if (modelsWithLegacyId.length === 0) {
            console.log('✅ All models already have categoryIds populated');
            return;
        }

        // Step 2: Batch update (1000 at a time)
        const BATCH_SIZE = 1000;
        for (let i = 0; i < modelsWithLegacyId.length; i += BATCH_SIZE) {
            const batch = modelsWithLegacyId.slice(i, i + BATCH_SIZE);
            const bulkOps = batch.map(model => ({
                updateOne: {
                    filter: { _id: model._id },
                    update: {
                        $set: {
                            categoryIds: [model.categoryId]
                        }
                    }
                }
            }));

            await Model.bulkWrite(bulkOps);
            console.log(`✅ Migrated batch ${i / BATCH_SIZE + 1}/${Math.ceil(modelsWithLegacyId.length / BATCH_SIZE)}`);
        }

        console.log('✅ Migration complete!');
        console.log('📝 Next: Update Model schema to remove categoryId field');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await conn.disconnect();
    }
}

// CLI execution
const args = process.argv.slice(2);
const isRollback = args.includes('--rollback');
migrateModelCategoryIds(isRollback).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
