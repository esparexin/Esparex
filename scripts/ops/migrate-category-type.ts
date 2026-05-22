import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined.');
    process.exit(1);
}

async function migrateCategoryType() {
    console.log('🔌 Connecting to Database...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('✅ Connected to DB.');

    try {
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established.');
        }
        
        const categoriesCollection = db.collection('categories');
        
        console.log('⏳ Migrating \'categories\' collection...');
        const categoriesCursor = categoriesCollection.find({ type: { $exists: true } });
        
        let migratedCount = 0;
        for await (const doc of categoriesCursor) {
            const oldType = doc.type ? String(doc.type).toLowerCase() : null;
            const listingType = Array.isArray(doc.listingType) ? [...doc.listingType] : [];
            
            // Map old type to listingType if valid and missing
            if (oldType && ['ad', 'spare_part', 'service'].includes(oldType)) {
                if (!listingType.includes(oldType)) {
                    listingType.push(oldType);
                }
            } else if (!listingType.includes('ad')) {
                 // default fallback just in case
                 listingType.push('ad');
            }

            await categoriesCollection.updateOne(
                { _id: doc._id },
                { 
                    $set: { listingType },
                    $unset: { type: "" } 
                }
            );
            migratedCount++;
        }
        
        console.log(`✅ Synced listingType and unset type for ${migratedCount} categories.`);
        console.log('✅ Catalog category type migration complete!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from DB.');
    }
}

migrateCategoryType();
