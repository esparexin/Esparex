const mongoose = require('mongoose');
const slugify = require('slugify');
const path = require('path');
const { nanoid } = require('nanoid');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

function generateSlug(name) {
    const base = slugify(name, {
        lower: true,
        strict: true,
        trim: true
    });
    return `${base}-${nanoid(5)}`;
}

async function runRepair() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log('\n--- 🛠️  STEP 1: REPAIRING CATEGORY METADATA ---');
        
        // 1. General Metadata Fix
        const genResult = await db.collection('categories').updateMany(
            { isActive: true },
            { $set: { supportsModel: true } }
        );
        console.log(`Updated supportsModel=true for ${genResult.modifiedCount} categories.`);

        // 2. Part Support Fix (Mobiles, Tablets, Laptops)
        const partResult = await db.collection('categories').updateMany(
            { slug: { $in: ['mobiles', 'tablets', 'laptops'] } },
            { $set: { supportsSpareParts: true } }
        );
        console.log(`Updated supportsSpareParts=true for ${partResult.modifiedCount} categories.`);

        // 3. Screen Size Toggle Fix (Laptops, Led-TV)
        const screenResult = await db.collection('categories').updateMany(
            { slug: { $in: ['laptops', 'led-tv'] } },
            { $set: { hasScreenSizes: true } }
        );
        console.log(`Updated hasScreenSizes=true for ${screenResult.modifiedCount} categories.`);

        console.log('\n--- 🛠️  STEP 2: GENERATING BRAND SLUGS ---');
        const brands = await db.collection('brands').find({ slug: { $exists: false } }).toArray();
        console.log(`Found ${brands.length} brands missing slugs.`);

        let repairCount = 0;
        for (const brand of brands) {
            const slug = generateSlug(brand.name);
            await db.collection('brands').updateOne(
                { _id: brand._id },
                { $set: { slug } }
            );
            repairCount++;
        }
        console.log(`Successfully generated slugs for ${repairCount} brands.`);

        console.log('\n✅ Catalog Repair Complete!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Repair failed:', err);
        process.exit(1);
    }
}

runRepair();
