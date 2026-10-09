/**
 * ESPAREX — CatalogSeedService.ts
 *
 * Canonical home for catalog seed logic (P1-8, DECISION-GATE §2/§5).
 * Backend seed scripts (`backend/api/src/seeds/`) are thin callers; all catalog
 * data writes live here in the catalog domain — no direct model imports in the
 * backend seed layer. Relocated from `spareParts.seed.ts`, `serviceTypes.seed.ts`,
 * `screenSizes.seed.ts`, and the screen-size step of `brands-models-expansion.seed.ts`.
 */
import mongoose from 'mongoose';
import slugify from 'slugify';
import Category from '../../../../models/Category';
import SparePart from '../../../../models/SparePart';
import ServiceType from '../../../../models/ServiceType';
import ScreenSize from '../../../../models/ScreenSize';
import logger from '../../../../utils/logger';
import { escapeRegExp } from '../../../../utils/stringUtils';
import { LISTING_TYPE } from '@esparex/contracts';

export interface SparePartSeedInput {
    name: string;
    type: 'PRIMARY' | 'SECONDARY';
    categories: string[];
}

export interface ServiceTypeSeedInput {
    name: string;
    categorySlugOrName: string;
}

export interface ScreenSizeSeedInput {
    size: string;
    value: number;
}

const TV_SIZES: ScreenSizeSeedInput[] = [
    { size: '32"', value: 32 }, { size: '40"', value: 40 },
    { size: '43"', value: 43 }, { size: '50"', value: 50 },
    { size: '55"', value: 55 }, { size: '65"', value: 65 },
    { size: '75"', value: 75 }, { size: '85"', value: 85 },
];

const MONITOR_SIZES: ScreenSizeSeedInput[] = [
    { size: '19"', value: 19 }, { size: '22"', value: 22 },
    { size: '24"', value: 24 }, { size: '27"', value: 27 },
    { size: '32"', value: 32 }, { size: '34"', value: 34 },
];

export class CatalogSeedService {
    /**
     * Upserts spare-part seed entries, resolving category slugs to ids.
     * Idempotent — safe to re-run.
     */
    static async seedSpareParts(parts: SparePartSeedInput[]): Promise<void> {
        logger.info('🌱 Seeding spare parts...');

        for (const part of parts) {
            const slug = slugify(part.name, { lower: true });

            const categoryIds = [];
            for (const catSlug of part.categories) {
                const cat = await Category.findOne({ slug: new RegExp(`^${escapeRegExp(catSlug)}$`, 'i') });
                if (cat) {
                    categoryIds.push(cat._id);
                }
            }

            if (categoryIds.length === 0) {
                logger.warn(`❌ Skipping ${part.name}: No valid categories found`);
                continue;
            }

            try {
                await SparePart.findOneAndUpdate(
                    { slug },
                    {
                        $set: {
                            name: part.name,
                            categoryIds,
                            listingType: [LISTING_TYPE.AD, LISTING_TYPE.SPARE_PART],
                            isActive: true,
                            isDeleted: false,
                            usageCount: 0,
                            sortOrder: 0,
                            createdBy: new mongoose.Types.ObjectId(), // system seed
                        },
                    },
                    { upsert: true, new: true }
                );
                logger.info(`✅ Synced: ${part.name}`);
            } catch (error: unknown) {
                const duplicateKey =
                    typeof error === 'object' && error !== null && 'code' in error &&
                    (error as { code?: unknown }).code === 11000;
                if (duplicateKey) {
                    logger.warn(`⚠️  Skipped (duplicate key): ${part.name}`);
                } else {
                    logger.error(`❌ Error inserting ${part.name}:`, error);
                }
            }
        }

        logger.info('✅ Spare parts seeding completed');
    }

    /**
     * Seeds default service types per device category.
     * Idempotent — safe to re-run; skips entries whose category is missing
     * or that already exist (matched by name + categoryId).
     */
    static async seedServiceTypes(entries: ServiceTypeSeedInput[]): Promise<void> {
        logger.info('🌱 Seeding service types...');

        const uniqueNames = [...new Set(entries.map(e => e.categorySlugOrName))];
        const categoryMap = new Map<string, string>();

        for (const nameOrSlug of uniqueNames) {
            const cat = await Category.findOne({
                $or: [
                    { slug: { $regex: new RegExp(`^${nameOrSlug}$`, 'i') } },
                    { name: { $regex: new RegExp(`^${nameOrSlug}$`, 'i') } },
                ],
                isDeleted: { $ne: true },
            }).select('_id name').lean();

            if (cat) {
                categoryMap.set(nameOrSlug, String(cat._id));
                logger.info(`  ✓ Matched category "${nameOrSlug}" → ${cat._id}`);
            } else {
                logger.warn(`  ⚠ Category not found for "${nameOrSlug}" — skipping its service types`);
            }
        }

        let created = 0;
        let skipped = 0;

        for (const entry of entries) {
            const categoryId = categoryMap.get(entry.categorySlugOrName);
            if (!categoryId) { skipped++; continue; }

            const existing = await ServiceType.findOne({
                name: { $regex: new RegExp(`^${entry.name}$`, 'i') },
                categoryIds: categoryId,
            });

            if (existing) {
                skipped++;
                continue;
            }

            await ServiceType.create({
                name: entry.name,
                categoryIds: [categoryId],
                isActive: true,
            });
            created++;
        }

        logger.info(`✅ Service types seeded: ${created} created, ${skipped} skipped (already existed or category not found).`);
    }

    /**
     * Ensures upserted screen-size entries for a category slug.
     * Used by `seedScreenSizes` and the brands-models-expansion seed.
     */
    static async ensureScreenSizes(categorySlug: string, sizes: ScreenSizeSeedInput[]): Promise<void> {
        const cat = await Category.findOne({ slug: categorySlug }).lean();
        if (!cat) {
            logger.warn(`⚠️ Category '${categorySlug}' not found. Skipping screen sizes.`);
            return;
        }

        for (const item of sizes) {
            await ScreenSize.findOneAndUpdate(
                { size: item.size, categoryId: cat._id },
                {
                    size: item.size,
                    name: `${item.size} Screen Size`,
                    displayName: `${item.size} Screen Size`,
                    value: item.value,
                    categoryId: cat._id,
                    isActive: true,
                    isDeleted: false,
                },
                { upsert: true }
            );
        }
    }

    /**
     * Seeds the standard TV + monitor screen sizes. Idempotent.
     */
    static async seedScreenSizes(): Promise<void> {
        logger.info('🌱 Seeding screen sizes (TVs & Monitors)...');
        try {
            await CatalogSeedService.ensureScreenSizes('led-tvs', TV_SIZES);
            await CatalogSeedService.ensureScreenSizes('monitors', MONITOR_SIZES);
            logger.info('✅ Screen sizes seeded successfully.');
        } catch (error) {
            logger.error('❌ Error seeding screen sizes:', error);
        }
    }
}
