
import { connectDB, getUserConnection, getAdminConnection } from '../config/db';
import logger from '../utils/logger';
import mongoose from 'mongoose';

/**
 * ESPAREX INDEX ARCHITECTURE STABILIZATION
 * 
 * Phases:
 * 1. Legacy Cleanup (80+ _1 indexes)
 * 2. Compound Performance Index Creation (Ads/Hierarchy)
 * 3. Text Search Index Audit & Creation
 * 4. Sequential Sync
 */

const IS_DRY_RUN = process.env.STABILIZE_EXECUTE !== 'true';

async function stabilize() {
    logger.info(`🚀 Starting Index Architecture Stabilization [Mode: ${IS_DRY_RUN ? 'DRY RUN' : 'EXECUTE'}]`);
    await connectDB();

    const dbs = [
        { name: 'User DB', conn: getUserConnection() },
        { name: 'Admin DB', conn: getAdminConnection() }
    ];

    const hierarchyCollections = ['categories', 'locations', 'servicecategories'];

    for (const { name, conn } of dbs) {
        // @ts-ignore
        const db = conn.db;
        if (!db) continue;

        logger.info(`Processing Database: ${name}`);
        const collections = await db.listCollections().toArray();

        for (const col of collections) {
            const collection = db.collection(col.name);
            const indexes = await collection.indexes();

            for (const idx of indexes) {
                const idxName = idx.name || 'unknown';
                // Phase 1: Legacy Cleanup
                const isLegacy = idxName.endsWith('_1') || (!idxName.startsWith('idx_') && !idxName.startsWith('ad_') && idxName !== '_id_');
                
                if (isLegacy) {
                    logger.warn(`[${col.name}] Legacy index detected: "${idxName}". DROP RECOMMENDED.`);
                    if (!IS_DRY_RUN) {
                        try {
                            await collection.dropIndex(idxName);
                            logger.info(`[${col.name}] Successfully DROPPED "${idxName}"`);
                        } catch (e) {
                            logger.error(`[${col.name}] Failed to drop "${idxName}"`, e);
                        }
                    }
                }
            }

            // Phase 2: Performance Indices
            // Ads Marketplace
            if (col.name === 'ads') {
                const adsPerfSpec = { categoryId: 1, brandId: 1, modelId: 1, status: 1, createdAt: -1 };
                const adsPerfName = 'idx_ads_main_marketplace_perf';
                const hasAdsPerf = indexes.some(idx => idx.name === adsPerfName);

                if (!hasAdsPerf) {
                    logger.info(`[ads] Missing marketplace performance index. CREATE RECOMMENDED.`);
                    if (!IS_DRY_RUN) {
                        await collection.createIndex(adsPerfSpec, { name: adsPerfName, background: true });
                        logger.info(`[ads] Triggered background creation for "${adsPerfName}"`);
                    }
                }
            }

            // Hierarchy Optimization
            if (hierarchyCollections.includes(col.name)) {
                const hierPerfSpec = { parentId: 1, status: 1, sortOrder: 1 };
                const hierPerfName = `idx_${col.name}_hierarchy_perf`;
                const hasHierPerf = indexes.some(idx => idx.name === hierPerfName);

                if (!hasHierPerf) {
                    logger.info(`[${col.name}] Missing hierarchy performance index. CREATE RECOMMENDED.`);
                    if (!IS_DRY_RUN) {
                        await collection.createIndex(hierPerfSpec, { name: hierPerfName, background: true });
                        logger.info(`[${col.name}] Triggered background creation for "${hierPerfName}"`);
                    }
                }
            }

            // Phase 3: Text Search
            if (['ads', 'businesses', 'spareparts', 'services'].includes(col.name)) {
                const hasText = indexes.some(idx => Object.values(idx.key).includes('text'));
                if (!hasText) {
                    logger.info(`[${col.name}] Missing text search index. CREATE RECOMMENDED.`);
                    // Logic to define title/description/keywords text index
                    const textSpec: any = { title: 'text', description: 'text' };
                    if (col.name === 'ads' || col.name === 'spareparts') textSpec.keywords = 'text';

                    if (!IS_DRY_RUN) {
                        await collection.createIndex(textSpec, { name: `idx_${col.name}_text_search`, background: true });
                        logger.info(`[${col.name}] Triggered background creation for text search.`);
                    }
                }
            }
        }
    }

    // Phase 4: Sequential Sync
    if (!IS_DRY_RUN) {
        logger.info('🔄 Cleanup complete. Running sequential syncIndexes for all models...');
        require('../models/registry'); 
        
        const priorityOrder = ['Category', 'Brand', 'Model', 'Location', 'Ad', 'Business', 'SmartAlert'];
        const allModels: Record<string, mongoose.Model<any>> = {};
        
        dbs.forEach(d => {
            Object.entries(d.conn.models).forEach(([name, model]) => {
                allModels[name] = model as mongoose.Model<any>;
            });
        });

        const sortedModelNames = Object.keys(allModels).sort((a, b) => {
            const indexA = priorityOrder.indexOf(a);
            const indexB = priorityOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        for (const modelName of sortedModelNames) {
            const model = allModels[modelName];
            try {
                logger.info(`[Sync] Syncing indexes for ${modelName}...`);
                await (model as any).syncIndexes();
                logger.info(`[Sync] OK: ${modelName}`);
            } catch (err) {
                logger.error(`[Sync] Failed: ${modelName}`, err);
            }
        }
    } else {
        logger.info('💡 Dry Run finished. Use STABILIZE_EXECUTE=true to apply changes.');
    }

    process.exit(0);
}

stabilize().catch(err => {
    logger.error('Stabilization Error', err);
    process.exit(1);
});
