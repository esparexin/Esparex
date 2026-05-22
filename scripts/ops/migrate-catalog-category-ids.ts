import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined.");
    process.exit(1);
}

const migrateCatalogCategoryIds = async () => {
    try {
        console.log(`🔌 Connecting to Database...`);
        const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
        console.log(`✅ Connected to DB.`);

        const brandsCollection = conn.db!.collection('brands');
        const modelsCollection = conn.db!.collection('models');

        // 1. Migrate Brands
        console.log(`⏳ Migrating 'brands' collection...`);
        
        // Find brands that have categoryId but it's not in categoryIds array
        // (This is mostly a safety net as pre-validate hooks should have synced them)
        const brandsWithMissingCategoryIds = await brandsCollection.find({
            categoryId: { $exists: true, $ne: null }
        }).toArray();

        let brandMigrationCount = 0;
        for (const brand of brandsWithMissingCategoryIds) {
            const currentIds = Array.isArray(brand.categoryIds) ? brand.categoryIds.map(String) : [];
            const categoryIdStr = String(brand.categoryId);
            
            if (!currentIds.includes(categoryIdStr)) {
                await brandsCollection.updateOne(
                    { _id: brand._id },
                    { $push: { categoryIds: brand.categoryId } }
                );
                brandMigrationCount++;
            }
        }
        console.log(`   ✅ Synced categoryIds for ${brandMigrationCount} brands.`);

        // Now unset categoryId on all brands
        const brandUnsetResult = await brandsCollection.updateMany(
            { categoryId: { $exists: true } },
            { $unset: { categoryId: 1 } }
        );
        console.log(`   ✅ Unset categoryId on ${brandUnsetResult.modifiedCount} brands.`);

        // 2. Migrate Models
        console.log(`⏳ Migrating 'models' collection...`);
        
        const modelsWithMissingCategoryIds = await modelsCollection.find({
            categoryId: { $exists: true, $ne: null }
        }).toArray();

        let modelMigrationCount = 0;
        for (const model of modelsWithMissingCategoryIds) {
            const currentIds = Array.isArray(model.categoryIds) ? model.categoryIds.map(String) : [];
            const categoryIdStr = String(model.categoryId);
            
            if (!currentIds.includes(categoryIdStr)) {
                await modelsCollection.updateOne(
                    { _id: model._id },
                    { $push: { categoryIds: model.categoryId } }
                );
                modelMigrationCount++;
            }
        }
        console.log(`   ✅ Synced categoryIds for ${modelMigrationCount} models.`);

        // Now unset categoryId on all models
        const modelUnsetResult = await modelsCollection.updateMany(
            { categoryId: { $exists: true } },
            { $unset: { categoryId: 1 } }
        );
        console.log(`   ✅ Unset categoryId on ${modelUnsetResult.modifiedCount} models.`);

        console.log(`✅ Catalog categoryId migration complete!`);

        await conn.close();
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
};

void migrateCatalogCategoryIds();
