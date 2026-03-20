const mongoose = require('mongoose');
const path = require('path');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

// CANONICAL CATEGORY IDs
const CAT_IDS = {
    LAPTOPS: '6986e01272e5a623e69f097e',
    TABLETS: '6986e6735198ef7741aed1f6',
    MOBILES: '698741b2820e62e091a7a7d4',
    LED_TV:  '69b1645fc69f2bcfcd9dc730'
};

const VALID_CAT_IDS = Object.values(CAT_IDS).map(id => new mongoose.Types.ObjectId(id));

async function runRecovery() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const brands = db.collection('brands');
        const spareparts = db.collection('spareparts');
        const categories = db.collection('categories');

        console.log('\n--- 🛠️ MASTER DATA EMERGENCY RECOVERY START ---');

        // 1. RE-MAP BRANDS
        console.log('Processing brands...');
        const allBrands = await brands.find({}).toArray();
        let brandUpdates = 0;

        for (const brand of allBrands) {
            let targetCatId = null;
            const name = brand.name.toLowerCase();

            // Fuzzy matching logic
            if (name.includes('macbook') || name.includes('dell') || name.includes('hp') || name.includes('lenovo') || name.includes('asus') || name.includes('acer') || name.includes('msi') || name.includes('razer')) {
                targetCatId = CAT_IDS.LAPTOPS;
            } else if (name.includes('ipad') || name.includes('galaxy tab') || name.includes('tab') || name.includes('pad')) {
                targetCatId = CAT_IDS.TABLETS;
            } else if (name.includes('tv') || name.includes('sony') || name.includes('lg') || name.includes('panasonic') || name.includes('tcl') || name.includes('hisense') || name.includes('vu')) {
                targetCatId = CAT_IDS.LED_TV;
            } else if (name.includes('iphone') || name.includes('redmi') || name.includes('poco') || name.includes('oneplus') || name.includes('xiaomi') || name.includes('realme') || name.includes('vivo')) {
                targetCatId = CAT_IDS.MOBILES;
            }

            // Check if current categoryId is valid
            let isCurrentlyValid = false;
            if (brand.categoryId) {
                const exists = await categories.findOne({ _id: brand.categoryId });
                if (exists) isCurrentlyValid = true;
            }

            if (!isCurrentlyValid) {
                const finalCatId = targetCatId ? new mongoose.Types.ObjectId(targetCatId) : new mongoose.Types.ObjectId(CAT_IDS.MOBILES);
                const update = {
                    $set: {
                        categoryId: finalCatId,
                        needsReview: true,
                        migrationRestored: true,
                        updatedAt: new Date()
                    }
                };
                await brands.updateOne({ _id: brand._id }, update);
                brandUpdates++;
            }
        }
        console.log(`✅ Updated ${brandUpdates} brands.`);

        // 2. SCRUB SPARE PARTS
        console.log('Processing spare parts...');
        const allParts = await spareparts.find({}).toArray();
        let partUpdates = 0;

        for (const part of allParts) {
            if (!part.categories || !Array.isArray(part.categories)) {
                await spareparts.updateOne({ _id: part._id }, {
                    $set: { categories: [new mongoose.Types.ObjectId(CAT_IDS.MOBILES)], needsReview: true, updatedAt: new Date() }
                });
                partUpdates++;
                continue;
            }

            // Filter for valid category IDs
            const validIds = [];
            for (const catId of part.categories) {
                const exists = await categories.findOne({ _id: catId });
                if (exists) validIds.push(catId);
            }

            if (validIds.length === 0) {
                validIds.push(new mongoose.Types.ObjectId(CAT_IDS.MOBILES));
            }

            if (validIds.length !== part.categories.length || part.categories.length === 0) {
                await spareparts.updateOne({ _id: part._id }, {
                    $set: { categories: validIds, needsReview: true, updatedAt: new Date() }
                });
                partUpdates++;
            }
        }
        console.log(`✅ Scrubbed ${partUpdates} spare parts.`);

        await mongoose.disconnect();
        console.log('\n--- 🏁 RECOVERY COMPLETED SUCCESSFULLY ---');
    } catch (err) {
        console.error('Recovery failed:', err);
        process.exit(1);
    }
}

runRecovery();
