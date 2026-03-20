const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Path to backend's .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGO_URI = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

async function migrateIndexes() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const brands = db.collection('brands');
        const screensizes = db.collection('screensizes');

        console.log('--- Migrating Brand Indexes ---');
        console.log('1. Creating brand_categoryId_name_unique background index...');
        await brands.createIndex(
            { categoryId: 1, name: 1 },
            {
                name: 'brand_categoryId_name_unique',
                unique: true,
                collation: { locale: 'en', strength: 2 },
                background: true,
                partialFilterExpression: { isDeleted: false, status: { $in: ['active', 'approved', 'pending'] } }
            }
        );

        console.log('2. Dropping brand_name_unique_ci...');
        try {
            await brands.dropIndex('brand_name_unique_ci');
            console.log('Dropped old global brand name index.');
        } catch (e) {
             console.log('Old brand index not found or already dropped.');
        }

        console.log('--- Hardening ScreenSize Indexes ---');
        console.log('1. Creating screensize_size_category_brand_unique...');
        await screensizes.createIndex(
            { size: 1, categoryId: 1, brandId: 1 },
            {
                name: 'screensize_size_category_brand_unique',
                unique: true,
                background: true,
                partialFilterExpression: { isDeleted: false }
            }
        );

        await mongoose.disconnect();
        console.log('Index migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateIndexes();
