#!/usr/bin/env npx tsx

/**
 * Listing Image Watermark Backfill Utility
 * Esparex Monorepo Operational Utility
 *
 * Safely enqueues existing active/pending listings to the BullMQ image-optimization-events
 * queue, where the canonical imageWorker applies the Esparex watermark to high-res images.
 *
 * Usage:
 *   npx tsx scripts/backfill-listing-watermarks.ts --dry-run
 *   npx tsx scripts/backfill-listing-watermarks.ts --apply --limit 50
 */

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../core/.env') });
dotenv.config({ path: path.resolve(__dirname, '../backend/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const limitArgIndex = process.argv.indexOf('--limit');
const LIMIT = limitArgIndex !== -1 && process.argv[limitArgIndex + 1] ? Number(process.argv[limitArgIndex + 1]) : 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
    console.log('\n======================================================');
    console.log(`  Esparex Listing Watermark Backfill (${isDryRun ? 'DRY RUN' : 'APPLY MODE'})`);
    console.log('  SSOT: BullMQ image-optimization-events / imageWorker');
    console.log('======================================================\n');

    const { connectDB, closeDB } = await import('../core/src/config/db');
    const Ad = (await import('../core/src/models/Ad')).default;
    const { enqueueImageOptimization } = await import('../core/src/queues/imageQueue');

    try {
        await connectDB();

        const query = {
            $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
            status: { $in: ['active', 'pending'] },
            images: { $exists: true, $not: { $size: 0 } },
        };

        const listings = await Ad.find(query).limit(LIMIT).lean();
        console.log(`Found ${listings.length} eligible listing(s) (limit: ${LIMIT}).\n`);

        if (isDryRun) {
            console.log('[Dry Run] Sample listings that would be queued for watermark processing:');
            listings.slice(0, 10).forEach((ad) => {
                const imgCount = Array.isArray(ad.images) ? ad.images.length : 0;
                console.log(`  - [${ad._id.toString()}] (${ad.listingType || 'ad'}) "${ad.title}" - ${imgCount} image(s)`);
            });
            if (listings.length > 10) {
                console.log(`  ... and ${listings.length - 10} more listings.`);
            }
            console.log('\n[Dry Run] No jobs were enqueued. Re-run with --apply to enqueue jobs.');
        } else {
            console.log(`[Apply] Enqueuing ${listings.length} listing(s) into image-optimization-events...`);
            let enqueuedCount = 0;

            for (const ad of listings) {
                const images = Array.isArray(ad.images) ? (ad.images as string[]) : [];
                if (images.length > 0) {
                    await enqueueImageOptimization(ad._id.toString(), 'ad', images);
                    enqueuedCount++;
                    // Rate limit: 50ms pause between enqueues to avoid Redis spikes
                    await sleep(50);
                }
            }

            console.log(`\n[Apply] Successfully enqueued ${enqueuedCount} listing(s) for watermark optimization.`);
        }
    } catch (error) {
        console.error('[Error] Backfill failed:', error);
        process.exitCode = 1;
    } finally {
        await closeDB();
        process.exit(process.exitCode || 0);
    }
}

void run();
