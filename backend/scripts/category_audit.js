const mongoose = require('mongoose');
const path = require('path');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function auditCategories() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log('\n--- 🔎 DEEP CATEGORY AUDIT ---');
        
        // 1. List all categories (including soft-deleted)
        const categories = await db.collection('categories').find({}).toArray();
        console.log(`Total category documents: ${categories.length}`);
        
        console.table(categories.map(c => ({
            _id: c._id.toString(),
            name: c.name,
            slug: c.slug,
            isDeleted: !!c.isDeleted,
            status: c.status,
            level: c.level || 0
        })));

        // 2. Sample some orphan brands to see names
        console.log('\n--- 🔎 ORPHAN BRAND NAMES (Sample) ---');
        const orphanBrandSamples = await db.collection('brands').find({
            $or: [
                { categoryId: { $exists: false } },
                { categoryId: null }
            ]
        }).limit(20).toArray();
        
        console.table(orphanBrandSamples.map(b => ({
            _id: b._id.toString(),
            name: b.name,
            currentCategoryId: b.categoryId ? b.categoryId.toString() : 'NULL'
        })));

        const invalidLinkSamples = await db.collection('brands').aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $match: {
                    $and: [
                        { categoryId: { $exists: true, $ne: null } },
                        { category: { $size: 0 } }
                    ]
                }
            },
            { $limit: 20 }
        ]).toArray();

        console.log('\n--- 🔎 INVALID CATEGORY LINK SAMPLES ---');
        console.table(invalidLinkSamples.map(b => ({
            _id: b._id.toString(),
            name: b.name,
            brokenCategoryId: b.categoryId ? b.categoryId.toString() : 'N/A'
        })));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Category Audit failed:', err);
        process.exit(1);
    }
}

auditCategories();
