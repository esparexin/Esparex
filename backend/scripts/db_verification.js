const mongoose = require('mongoose');
const path = require('path');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function verifyDatabase() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log('\n--- 🔎 CATEGORY INTEGRITY CHECK ---');
        const categories = await db.collection('categories').find({}).toArray();
        const catStats = categories.map(c => ({
            name: c.name,
            slug: c.slug,
            type: c.type,
            supportsModel: !!c.supportsModel,
            supportsSpareParts: !!c.supportsSpareParts,
            hasScreenSizes: !!c.hasScreenSizes,
            isDeleted: !!c.isDeleted
        }));
        console.table(catStats);

        // Check for duplicate slugs in categories
        const catSlugs = categories.map(c => c.slug);
        const dupCatSlugs = catSlugs.filter((s, i) => catSlugs.indexOf(s) !== i);
        if (dupCatSlugs.length > 0) {
            console.error('❌ Duplicate Category Slugs found:', dupCatSlugs);
        } else {
            console.log('✅ No duplicate Category slugs.');
        }

        console.log('\n--- 🔎 BRAND INTEGRITY CHECK ---');
        const totalBrands = await db.collection('brands').countDocuments();
        const brandsWithNoSlug = await db.collection('brands').countDocuments({ slug: { $exists: false } });
        const brandsWithNeedsReview = await db.collection('brands').countDocuments({ needsReview: true });
        
        console.log(`Total Brands: ${totalBrands}`);
        console.log(`Brands missing slug: ${brandsWithNoSlug}`);
        console.log(`Brands flagged 'needsReview': ${brandsWithNeedsReview}`);

        // Check for potential duplicate names in same category
        const brandDupCheck = await db.collection('brands').aggregate([
            {
                $group: {
                    _id: { name: "$name", categoryId: "$categoryId" },
                    count: { $sum: 1 }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();

        if (brandDupCheck.length > 0) {
            console.warn('⚠️ Potential Duplicate Brands (Name + CategoryID) found:', brandDupCheck.length);
        } else {
            console.log('✅ Brand uniqueness (Name + CategoryID) holds.');
        }

        console.log('\n--- 🔎 SPARE PARTS INTEGRITY CHECK ---');
        const sparePartsList = await db.collection('spareparts').find({}).toArray();
        const partStats = sparePartsList.map(p => ({
            name: p.name,
            categoriesCount: p.categories?.length || 0,
            status: p.status,
            needsReview: !!p.needsReview
        }));
        console.table(partStats);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Database Verification failed:', err);
        process.exit(1);
    }
}

verifyDatabase();
