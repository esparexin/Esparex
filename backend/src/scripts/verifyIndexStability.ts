import mongoose from 'mongoose';
import { getUserConnection } from '../config/db';
import logger from '../utils/logger';
import { AD_STATUS } from '../../../shared/enums/adStatus';

export async function verifyIndexes() {
    logger.info('Verifying indexes for Ad collection...');
    
    const db = getUserConnection();
    const Ad = db.collection('ads');
    
    try {
        const indexes = await Ad.indexes();
        logger.info('Current Indexes:', JSON.stringify(indexes, null, 2));

        const requiredNames = [
            'ad_status_live_createdAt_minus1_partial',
            'ad_public_visibility_createdAt_idx',
            'ad_spotlight_live_createdAt_minus1_partial',
            'ad_duplicateFingerprint_unique_partial'
        ];

        for (const name of requiredNames) {
            const index = indexes.find(idx => idx.name === name);
            if (index) {
                logger.info(`✅ Found required index: ${name}`);
            } else {
                logger.error(`❌ Missing required index: ${name}`);
            }
        }

        // Run Explain on a query that should use the partial index
        logger.info('Running explain() on active ads query...');
        const explain = await Ad.find({ status: AD_STATUS.LIVE, isDeleted: false }).sort({ createdAt: -1 }).limit(10).explain();
        
        logger.info('Query Plan Strategy:', explain.queryPlanner?.winningPlan?.stage);
        
        // If it used the index, it should show IXSCAN
        const isUsingIndex = JSON.stringify(explain).includes('ad_status_live_createdAt_minus1_partial');
        if (isUsingIndex) {
            logger.info('✅ Query is using the canonical partial index.');
        } else {
            logger.warn('⚠️ Query is NOT using the expected partial index. Check explain output.');
        }

    } catch (error) {
        logger.error('Verification failed', { error });
        throw error;
    }
}

if (require.main === module) {
    const { connectDB } = require('../config/db');
    connectDB().then(() => {
        verifyIndexes().then(() => {
            logger.info('Verification script finished.');
            process.exit(0);
        }).catch(err => {
            logger.error('Verification failed', err);
            process.exit(1);
        });
    });
}
