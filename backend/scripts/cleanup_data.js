const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function cleanup() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const brands = db.collection('brands');
        const screensizes = db.collection('screensizes');

        console.log('--- Cleaning up Brands (plural categoryIds to singular categoryId) ---');
        // Find brands with categoryIds array but no categoryId string
        const brandsToFix = await brands.find({ categoryIds: { $exists: true, $not: { $size: 0 } }, categoryId: { $exists: false } }).toArray();
        console.log(`Found ${brandsToFix.length} brands to fix.`);

        for (const brand of brandsToFix) {
            const firstCatId = brand.categoryIds[0];
            await brands.updateOne({ _id: brand._id }, { $set: { categoryId: firstCatId }, $unset: { categoryIds: "" } });
            console.log(`Updated brand ${brand.name}: categoryId set to ${firstCatId}`);
        }

        console.log('--- Cleaning up ScreenSizes (orphans) ---');
        // Delete screen sizes that have no categoryId (as they are unusable)
        const ssResult = await screensizes.deleteMany({ categoryId: { $exists: false } });
        console.log(`Deleted ${ssResult.deletedCount} orphan screen sizes.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
}

cleanup();
