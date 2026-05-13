#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Redis = require('ioredis');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';
const REDIS_URL = process.env.REDIS_URL;

async function runValidation() {
    console.log('🔍 [Catalog Health Check] Initiating automated master catalog audit...');
    let exitCode = 0;

    // 1. Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`📡 Connected to database: ${mongoose.connection.name}`);

    try {
        // 2. Load active entities
        const categories = await db.collection('categories').find({ isDeleted: { $ne: true } }).toArray();
        const brands = await db.collection('brands').find({ isDeleted: { $ne: true } }).toArray();
        const models = await db.collection('models').find({ isDeleted: { $ne: true } }).toArray();

        console.log(`📊 Current Counts in DB:
- Categories: ${categories.length} total active
- Brands: ${brands.length} total active
- Models: ${models.length} total active`);

        // Assert basic presence
        if (categories.length === 0) {
            console.error('❌ FAIL: No active categories found in database!');
            exitCode = 1;
        }
        if (brands.length === 0) {
            console.error('❌ FAIL: No active brands found in database!');
            exitCode = 1;
        }
        if (models.length === 0) {
            console.error('❌ FAIL: No active models found in database!');
            exitCode = 1;
        }

        // 3. Validate specific key brands
        const expectedBrands = ['Apple', 'Samsung', 'BlackBerry'];
        for (const brandName of expectedBrands) {
            const match = brands.find(b => b.name === brandName);
            if (!match) {
                console.error(`❌ FAIL: Expected brand "${brandName}" is missing or soft-deleted!`);
                exitCode = 1;
            } else if (match.approvalStatus !== 'approved' || !match.isActive) {
                console.error(`❌ FAIL: Brand "${brandName}" is not approved or is inactive! (Status: ${match.approvalStatus}, Active: ${match.isActive})`);
                exitCode = 1;
            } else {
                console.log(`✅ OK: Brand "${brandName}" is healthy, active and approved.`);
            }
        }

        // 4. Check duplicate slugs
        const checkDuplicateSlugs = (items, typeName) => {
            const slugCounts = {};
            let duplicates = 0;
            for (const item of items) {
                if (item.slug) {
                    slugCounts[item.slug] = (slugCounts[item.slug] || 0) + 1;
                    if (slugCounts[item.slug] > 1) {
                        console.error(`❌ FAIL: Duplicate slug found in ${typeName}: "${item.slug}" (ID: ${item._id})`);
                        duplicates++;
                        exitCode = 1;
                    }
                }
            }
            if (duplicates === 0) {
                console.log(`✅ OK: No duplicate slugs in ${typeName}.`);
            }
        };

        checkDuplicateSlugs(categories, 'Categories');
        checkDuplicateSlugs(brands, 'Brands');
        checkDuplicateSlugs(models, 'Models');

        // 5. Check reference integrity
        const categoryMap = new Map(categories.map(c => [c._id.toString(), c]));
        const brandMap = new Map(brands.map(b => [b._id.toString(), b]));

        // Validate Brands -> Categories mappings
        let brokenBrandsCount = 0;
        for (const brand of brands) {
            const hasSingular = brand.categoryId && categoryMap.has(brand.categoryId.toString());
            const hasPlural = Array.isArray(brand.categoryIds) && brand.categoryIds.some(id => categoryMap.has(id.toString()));

            if (!hasSingular && !hasPlural) {
                console.error(`❌ FAIL: Brand "${brand.name}" has no valid active category references!`);
                brokenBrandsCount++;
                exitCode = 1;
            }
        }
        if (brokenBrandsCount === 0) {
            console.log('✅ OK: All brands possess valid category mappings.');
        }

        // Validate Models -> Brands & Categories mappings
        let brokenModelsCount = 0;
        for (const model of models) {
            const parentBrand = brandMap.get(model.brandId ? model.brandId.toString() : '');
            if (!parentBrand) {
                console.error(`❌ FAIL: Model "${model.name}" has missing/inactive parent brand!`);
                brokenModelsCount++;
                exitCode = 1;
                continue;
            }

            const hasSingular = model.categoryId && categoryMap.has(model.categoryId.toString());
            const hasPlural = Array.isArray(model.categoryIds) && model.categoryIds.some(id => categoryMap.has(id.toString()));

            if (!hasSingular && !hasPlural) {
                console.error(`❌ FAIL: Model "${model.name}" has no valid active category references!`);
                brokenModelsCount++;
                exitCode = 1;
            }
        }
        if (brokenModelsCount === 0) {
            console.log('✅ OK: All models possess valid parent brand and category mappings.');
        }

        // 6. Redis cache invalidation (Phase 5)
        if (REDIS_URL) {
            console.log('⚡ [Redis Cache Invalidation] Connecting to Redis server...');
            const redis = new Redis(REDIS_URL);
            
            const patterns = ['catalog:*', 'master:*'];
            let totalDeleted = 0;

            for (const pattern of patterns) {
                let cursor = '0';
                do {
                    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                    if (keys.length > 0) {
                        const count = await redis.del(...keys);
                        totalDeleted += count;
                    }
                    cursor = newCursor;
                } while (cursor !== '0');
            }

            console.log(`✅ OK: Successfully purged ${totalDeleted} catalog cache keys from Redis.`);
            redis.disconnect();
        } else {
            console.log('⚠️ Warning: REDIS_URL not configured. Cache invalidation skipped.');
        }

    } catch (err) {
        console.error('❌ FAIL: Health check encountered an unexpected error:', err.message);
        exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }

    if (exitCode === 0) {
        console.log('\n🌟 [Catalog Health Check] SUCCESS: The master catalog is fully healthy, valid, and synchronized!');
    } else {
        console.error('\n🚨 [Catalog Health Check] FAILURE: One or more data integrity violations detected.');
    }
    
    process.exit(exitCode);
}

runValidation();
