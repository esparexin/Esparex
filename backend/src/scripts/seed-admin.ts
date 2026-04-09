/**
 * Admin Seeder Script
 * ---------------------------------------
 * Canonical entry point for bootstrapping the default admin account.
 * Uses AdminService for lifecycle and connection safety.
 */

import 'dotenv/config';
import { connectDB } from '../config/db';
import { seedAdmin } from '../services/AdminService';
import logger from '../utils/logger';

async function run() {
    try {
        logger.info('🚀 Starting Admin Seeding...');

        // 1. Initialize DB connections
        await connectDB();

        // 2. Call canonical service
        const adminEmail = 'admin@esparex.com';
        await seedAdmin(adminEmail);

        logger.info('🎉 Admin seeding process completed.');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Admin seeding failed', {
            error: error instanceof Error ? error.message : String(error)
        });
        process.exit(1);
    }
}

run();
