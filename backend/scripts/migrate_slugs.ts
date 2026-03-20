// Script to Migrate Database Slugs for SEO
// Run with: npx ts-node scripts/migrate_slugs.ts

import dotenv from 'dotenv';
import path from 'path';
import type { Model as MongooseModel } from 'mongoose';
import Ad from '../src/models/Ad';
import Service from '../src/models/Service';
import Business from '../src/models/Business';
import { generateUniqueSlug } from '../src/utils/slugGenerator';
import { connectDB, getUserConnection } from '../src/config/db';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const BATCH_SIZE = 50;

type SlugMigrateModel = MongooseModel<unknown>;

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

async function migrateModel(Model: SlugMigrateModel, modelName: string, titleField: string, slugField: string) {
    console.info(`\n📦 Migrating ${modelName}...`);

    // Check total docs
    const totalDocs = await Model.countDocuments({});
    console.info(`Total documents in ${modelName}: ${totalDocs}`);

    // Find docs without valid slug
    const query = {
        $or: [
            { [slugField]: { $exists: false } },
            { [slugField]: null },
            { [slugField]: "" }
        ]
    };

    // Process in cursors
    const totalToMigrate = await Model.countDocuments(query);
    console.info(`Found ${totalToMigrate} ${modelName}s needing migration.`);

    let processed = 0;
    let errors = 0;

    const cursor = Model.find(query).cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        try {
            const docRecord = doc as Record<string, unknown>;
            const title = docRecord[titleField];
            if (!title) {
                console.warn(`⚠️  Skipping ${docRecord._id}: Missing ${titleField}`);
                continue;
            }

            // Generate Slug
            const slug = await generateUniqueSlug(Model, String(title));

            // Update explicitly
            await Model.updateOne(
                { _id: docRecord._id },
                { $set: { [slugField]: slug } }
            );

            processed++;
            if (processed % BATCH_SIZE === 0) {
                process.stdout.write(`.`);
            }
        } catch (err: unknown) {
            const docRecord = doc as Record<string, unknown>;
            console.error(`❌ Error migrating ${docRecord._id}:`, getErrorMessage(err));
            errors++;
        }
    }

    console.info(`\n✅ ${modelName} Complete: ${processed} updated, ${errors} failed.`);
}

async function runMigration() {
    console.info('🔌 Connecting to DB...');
    await connectDB();
    console.info('✅ Connected');

    try {
        // 1. Migrate Ads
        await migrateModel(Ad, 'Ad', 'title', 'seoSlug');

        // 2. Migrate Services
        await migrateModel(Service, 'Service', 'title', 'slug');

        // 3. Migrate Businesses
        await migrateModel(Business, 'Business', 'name', 'slug');

        console.info('\n✨ MIGRATION SUCCESSFULLY COMPLETED ✨');

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error);
    } finally {
        const conn = getUserConnection();
        await conn.close();
        console.info('🔌 Disconnected');
        process.exit(0);
    }
}

runMigration();
