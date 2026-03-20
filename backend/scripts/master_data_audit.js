const mongoose = require('mongoose');
const path = require('path');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function runAudit() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log('\n--- 🔎 BRAND -> CATEGORY CONNECTION AUDIT ---');

        const totalBrands = await db.collection('brands').countDocuments();
        console.log(`⭐ Total brands stored: ${totalBrands}`);

        const missingCategoryBrands = await db.collection('brands').countDocuments({
            $or: [
                { categoryId: { $exists: false } },
                { categoryId: null }
            ]
        });
        console.log(`⭐ Brands missing category connection (CRITICAL): ${missingCategoryBrands}`);

        const validCategoryBrands = await db.collection('brands').aggregate([
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
                    category: { $ne: [] }
                }
            },
            {
                $count: "brandsWithValidCategory"
            }
        ]).toArray();
        console.log(`⭐ Brands correctly connected to categories: ${validCategoryBrands[0]?.brandsWithValidCategory || 0}`);

        const orphanBrands = await db.collection('brands').aggregate([
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
                    category: { $size: 0 }
                }
            },
            {
                $count: "orphanBrands"
            }
        ]).toArray();
        console.log(`⭐ Orphan brands (categoryId exists but category missing): ${orphanBrands[0]?.orphanBrands || 0}`);


        console.log('\n--- 🔎 SPARE PARTS -> CATEGORY CONNECTION AUDIT ---');

        const totalSpareParts = await db.collection('spareparts').countDocuments();
        console.log(`⭐ Total spare parts stored: ${totalSpareParts}`);

        const missingMapParts = await db.collection('spareparts').countDocuments({
            $or: [
                { categories: { $exists: false } },
                { categories: { $size: 0 } }
            ]
        });
        console.log(`⭐ Spare parts without category mapping: ${missingMapParts}`);

        const validMapParts = await db.collection('spareparts').aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "matchedCategories"
                }
            },
            {
                $match: {
                    matchedCategories: { $ne: [] }
                }
            },
            {
                $count: "validSpareParts"
            }
        ]).toArray();
        console.log(`⭐ Spare parts correctly mapped to at least one category: ${validMapParts[0]?.validSpareParts || 0}`);

        const partiallyOrphanParts = await db.collection('spareparts').aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "matchedCategories"
                }
            },
            {
                $match: {
                    $expr: {
                        $lt: [
                            { $size: "$matchedCategories" },
                            { $size: "$categories" }
                        ]
                    }
                }
            },
            {
                $count: "partiallyOrphanSpareParts"
            }
        ]).toArray();
        console.log(`⭐ Orphan spare parts (categoryIds exist but category deleted): ${partiallyOrphanParts[0]?.partiallyOrphanSpareParts || 0}`);


        console.log('\n--- ✅ FULL MASTER DATA HEALTH REPORT ---');
        const healthReport = await db.collection('categories').aggregate([
            {
                $lookup: {
                    from: "brands",
                    localField: "_id",
                    foreignField: "categoryId",
                    as: "brands"
                }
            },
            {
                $lookup: {
                    from: "spareparts",
                    localField: "_id",
                    foreignField: "categories",
                    as: "spareparts"
                }
            },
            {
                $project: {
                    name: 1,
                    totalBrands: { $size: "$brands" },
                    totalSpareParts: { $size: "$spareparts" }
                }
            }
        ]).toArray();

        console.table(healthReport);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
}

runAudit();
