import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../backend/user/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

async function auditCatalog() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db!;
        
        console.log('--- Catalog Audit ---');
        
        // Check for brands with empty categoryIds
        const brandsNoCat = await db.collection('brands').countDocuments({
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } },
                { categoryIds: null }
            ],
            isDeleted: false
        });
        console.log(`Brands with no categoryIds: ${brandsNoCat}`);

        // Check for brands where isActive is false but they are not deleted
        const inactiveBrands = await db.collection('brands').countDocuments({
            isActive: false,
            isDeleted: false
        });
        console.log(`Inactive (but not deleted) brands: ${inactiveBrands}`);

        // Sample a few brands and categories
        const sampleBrands = await db.collection('brands').find({ isDeleted: false }).limit(3).toArray();
        console.log('\nSample Brands:');
        sampleBrands.forEach(b => {
            console.log(`- ${b.name} (${b._id}) | Categories: ${JSON.stringify(b.categoryIds)} | Status: ${b.status}`);
        });

        const sampleCategories = await db.collection('categories').find({ isDeleted: false }).limit(3).toArray();
        console.log('\nSample Categories:');
        sampleCategories.forEach(c => {
            console.log(`- ${c.name} (${c._id}) | Slug: ${c.slug} | Type: ${c.listingType}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

auditCatalog();
