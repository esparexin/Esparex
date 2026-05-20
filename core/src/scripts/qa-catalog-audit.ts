import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../backend/user/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

async function auditCatalog() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db!;
        
        console.log('--- CATALOG SSOT PRODUCTION VALIDATION ---');
        
        // 1. Collections Verification
        console.log('\n[1] COLLECTIONS VERIFICATION:');
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name.toLowerCase());
        const required = ['variants', 'attributes', 'catalogaliases', 'catalogsynonyms'];
        required.forEach(req => {
            const exists = collectionNames.includes(req);
            console.log(`${exists ? '✅' : '❌'} ${req}`);
        });

        // 2. Index Verification
        console.log('\n[2] INDEX VERIFICATION:');
        const checkIndex = async (collName: string, keys: string[]) => {
            try {
                const indexes = await db.collection(collName).indexes();
                const exists = indexes.some(idx => {
                    const idxKeys = Object.keys(idx.key);
                    return keys.every(k => idxKeys.includes(k)) && idxKeys.length === keys.length;
                });
                console.log(`${exists ? '✅' : '❌'} ${collName}: ${keys.join(', ')}`);
            } catch (e: unknown) {
                console.log(`❌ ${collName} (Error: ${e instanceof Error ? e.message : String(e)})`);
            }
        };
        await checkIndex('brands', ['categoryIds', 'slug']);
        await checkIndex('models', ['brandId', 'slug']);
        await checkIndex('variants', ['modelId', 'slug']);

        // 3. Status Governance
        console.log('\n[3] STATUS GOVERNANCE:');
        const leakCount = await db.collection('models').countDocuments({
            $or: [
                { approvalStatus: { $ne: 'approved' } },
                { isActive: { $ne: true } },
                { deletedAt: { $ne: null } }
            ]
        });
        console.log(`Leak Check (Pending/Rejected/Inactive/Deleted in public scope): ${leakCount === 0 ? '✅ PASS' : '❌ FAIL (' + leakCount + ' leaks)'}`);

        // 4. API Visibility Simulation
        console.log('\n[4] API VISIBILITY SIMULATION:');
        const publicModels = await db.collection('models').find({
            approvalStatus: 'approved',
            isActive: true,
            deletedAt: null
        }).limit(1).toArray();
        console.log(`Public Visibility: ${publicModels.length > 0 ? '✅ ACTIVE (' + publicModels[0].name + ')' : '⚠️ NO DATA'}`);

        // 5. Listing Compatibility
        console.log('\n[5] LISTING COMPATIBILITY:');
        const modelAds = await db.collection('ads').countDocuments({ modelId: { $exists: true } });
        const brandAds = await db.collection('ads').countDocuments({ brandId: { $exists: true } });
        console.log(`Ads with Models: ${modelAds}`);
        console.log(`Ads with Brands: ${brandAds}`);

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

auditCatalog();
