'use strict';
// Run from backend/ directory: node scripts/check-legacy-fields.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const url = process.env.ADMIN_MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/esparex_admin_db';
const dbName = url.split('/').pop().split('?')[0];

(async () => {
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);

    const noCatId = await db.collection('brands').countDocuments({
        $or: [{ categoryId: { $exists: false } }, { categoryId: null }]
    });
    const approvedBrands = await db.collection('brands').countDocuments({ status: 'approved' });
    const approvedModels = await db.collection('models').countDocuments({ status: 'approved' });
    const approvedCats   = await db.collection('categories').countDocuments({ status: 'approved' });
    const hasLegacyArr   = await db.collection('brands').countDocuments({
        categoryIds: { $exists: true, $ne: [] }
    });

    console.log({
        brands_missing_categoryId: noCatId,
        brands_with_legacy_categoryIds_array: hasLegacyArr,
        legacy_approved_status: { brands: approvedBrands, models: approvedModels, categories: approvedCats }
    });

    const safeToDropCategoryIds = noCatId === 0;
    const safeToDropApproved    = approvedBrands === 0 && approvedModels === 0 && approvedCats === 0;

    console.log('\n✅ Safe to run P3 migration (drop categoryIds):', safeToDropCategoryIds);
    console.log('✅ Safe to run P4 migration (drop approved indexes + CATALOG_BRIDGE):', safeToDropApproved);

    await client.close();
})().catch(e => { console.error(e.message); process.exit(1); });
