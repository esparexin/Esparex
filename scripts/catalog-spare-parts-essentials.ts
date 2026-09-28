#!/usr/bin/env npx tsx

/**
 * Essential Spare Parts Catalog Alignment Script
 * Esparex Monorepo Operational Utility
 *
 * 1. Sets listingType: ['ad', 'spare_part'] on active Drone spare parts so they
 *    appear in public catalog queries and Admin Dashboard visibility filters.
 * 2. Adds only genuine primary/essential spare parts to prevent user-facing clutter:
 *    - LED TVs: Power Supply Board (SMPS)
 *    - Mobiles & Tablets: Back Panel / Back Glass
 *    - Laptops: Hinges, Charger / Power Adapter
 *
 * Usage:
 *   npx tsx scripts/catalog-spare-parts-essentials.ts --dry-run
 *   npx tsx scripts/catalog-spare-parts-essentials.ts --apply
 */

import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../core/.env') });
dotenv.config({ path: path.resolve(__dirname, '../backend/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

interface EssentialPartDef {
    name: string;
    slug: string;
    canonicalName: string;
    categorySlugs: string[];
}

const ESSENTIAL_PARTS: EssentialPartDef[] = [
    {
        name: 'Power Supply Board',
        slug: 'power-supply-board',
        canonicalName: 'power supply board',
        categorySlugs: ['led-tvs'],
    },
    {
        name: 'Back Panel / Back Glass',
        slug: 'back-panel-back-glass',
        canonicalName: 'back panel back glass',
        categorySlugs: ['mobiles', 'tablets'],
    },
    {
        name: 'Hinges',
        slug: 'hinges',
        canonicalName: 'hinges',
        categorySlugs: ['laptops'],
    },
    {
        name: 'Charger / Power Adapter',
        slug: 'charger-power-adapter',
        canonicalName: 'charger power adapter',
        categorySlugs: ['laptops'],
    },
];

async function run(): Promise<void> {
    console.log('\n======================================================');
    console.log(`  Esparex Spare Parts Essentials (${isDryRun ? 'DRY RUN' : 'APPLY MODE'})`);
    console.log('  SSOT: MongoDB spareparts collection & Redis catalog cache');
    console.log('======================================================\n');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('Missing MONGODB_URI in environment.');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection failed.');
    }

    const categoriesCollection = db.collection('categories');
    const sparePartsCollection = db.collection('spareparts');

    // 1. Fetch active categories
    const categories = await categoriesCollection
        .find({ isDeleted: { $ne: true }, isActive: true })
        .toArray();

    const categoryMap = new Map<string, (typeof categories)[number]>(categories.map((c) => [c.slug, c]));
    console.log(`Loaded ${categories.length} active categories: ${Array.from(categoryMap.keys()).join(', ')}`);

    // Verify all needed categories exist
    const droneCat = categoryMap.get('drones');
    if (!droneCat) {
        throw new Error('Category "drones" not found in active categories.');
    }

    // 2. Audit & align Drone spare parts (listingType & clean semantic slugs)
    const droneParts = await sparePartsCollection
        .find({
            categoryIds: droneCat._id,
            isDeleted: { $ne: true },
        })
        .toArray();

    console.log(`\nAuditing ${droneParts.length} Drone spare parts for listingType & slug alignment...`);
    for (const p of droneParts) {
        const types = Array.isArray(p.listingType) ? p.listingType : [];
        const hasCorrectListingType = types.includes('ad') && types.includes('spare_part');
        const cleanSlug = p.slug.replace(/-[a-z0-9]{5}$/, '');
        const needsSlugClean = cleanSlug !== p.slug;

        if (!hasCorrectListingType || needsSlugClean) {
            console.log(`  - [${p.slug}] -> slug: "${cleanSlug}", listingType: ['ad', 'spare_part']`);
            if (!isDryRun) {
                await sparePartsCollection.updateOne(
                    { _id: p._id },
                    {
                        $set: {
                            slug: cleanSlug,
                            listingType: ['ad', 'spare_part'],
                            updatedAt: new Date(),
                        },
                    }
                );
            }
        }
    }

    // 3. Add / align Primary Essential Spare Parts
    console.log(`\nAuditing primary essential spare parts (${ESSENTIAL_PARTS.length} candidates)...`);
    for (const partDef of ESSENTIAL_PARTS) {
        const targetCategoryIds = partDef.categorySlugs
            .map((slug) => categoryMap.get(slug)?._id)
            .filter(Boolean);

        if (targetCategoryIds.length === 0) {
            console.error(`⚠️ Skipping ${partDef.name}: none of [${partDef.categorySlugs.join(', ')}] matched active categories.`);
            continue;
        }

        const existing = await sparePartsCollection.findOne({
            slug: partDef.slug,
            isDeleted: { $ne: true },
        });

        if (existing) {
            console.log(`  • "${partDef.name}" (${partDef.slug}) already exists [ID: ${existing._id}].`);
            if (!isDryRun) {
                await sparePartsCollection.updateOne(
                    { _id: existing._id },
                    {
                        $set: {
                            name: partDef.name,
                            displayName: partDef.name,
                            canonicalName: partDef.canonicalName,
                            categoryIds: targetCategoryIds,
                            listingType: ['ad', 'spare_part'],
                            isActive: true,
                            approvalStatus: 'approved',
                            status: 'live',
                            updatedAt: new Date(),
                        },
                    }
                );
                console.log(`    ✅ Refreshed categoryIds & metadata for "${partDef.name}".`);
            }
        } else {
            console.log(`  + "${partDef.name}" (${partDef.slug}) is missing -> TO BE INSERTED for [${partDef.categorySlugs.join(', ')}]`);
            if (!isDryRun) {
                const now = new Date();
                const newDoc = {
                    _id: new mongoose.Types.ObjectId(),
                    name: partDef.name,
                    displayName: partDef.name,
                    canonicalName: partDef.canonicalName,
                    slug: partDef.slug,
                    aliases: [],
                    synonyms: [],
                    listingType: ['ad', 'spare_part'],
                    categoryIds: targetCategoryIds,
                    brandId: null,
                    modelId: null,
                    sortOrder: 0,
                    usageCount: 0,
                    filters: [],
                    isActive: true,
                    approvalStatus: 'approved',
                    status: 'live',
                    createdBy: 'system:catalog-essentials',
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                };
                await sparePartsCollection.insertOne(newDoc);
                console.log(`    ✅ Inserted "${partDef.name}" [ID: ${newDoc._id}].`);
            }
        }
    }

    // 4. Redis cache invalidation (if not dry run)
    if (!isDryRun) {
        try {
            const redisUrl = process.env.REDIS_URL;
            if (redisUrl) {
                const { Redis } = await import('ioredis');
                const redis = new Redis(redisUrl);
                const keys = await redis.keys('catalog:spare-parts:*');
                if (keys.length > 0) {
                    await redis.del(...keys);
                    console.log(`\n🧹 Invalidated ${keys.length} cached Redis key(s) matching "catalog:spare-parts:*".`);
                } else {
                    console.log('\nNo catalog:spare-parts:* Redis keys found to invalidate.');
                }
                await redis.quit();
            }
        } catch (cacheErr) {
            console.warn('⚠️ Non-fatal Redis cache purge warning:', cacheErr);
        }
    }

    console.log('\n======================================================');
    console.log(`  ${isDryRun ? 'DRY RUN COMPLETE — No changes made.' : 'ALL ESSENTIALS ALIGNED SUCCESSFULLY.'}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('Fatal error during spare parts catalog alignment:', err);
    process.exit(1);
});
