import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import Ad from '../models/Ad';
import logger from '../utils/logger';

const migrateReviewVersion = async () => {
    try {
        await connectDB();
        logger.info('Starting reviewVersion migration...');

        const result = await Ad.updateMany(
            { reviewVersion: { $exists: false } },
            { $set: { reviewVersion: 0, freshnessScore: 0 } }
        );

        logger.info('Migration complete.', {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });

        process.exit(0);
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateReviewVersion();
