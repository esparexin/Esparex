const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

async function analyzeGovernance() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        
        console.log('--- DEVICE TAXONOMY GOVERNANCE ANALYSIS ---');
        
        const collections = ['categories', 'brands', 'models', 'variants', 'sparePartTypes', 'serviceTypes', 'screenSizes'];
        
        // 1. NON-APPROVED RECORD REVIEW
        console.log('\n[1] NON-APPROVED RECORDS:');
        for (const coll of collections) {
            const nonApproved = await db.collection(coll).find({
                approvalStatus: { $in: ['pending', 'rejected'] }
            }).toArray();
            
            if (nonApproved.length > 0) {
                console.log(`\nCollection: ${coll} (${nonApproved.length} records)`);
                nonApproved.forEach(r => {
                    console.log(`- ID: ${r._id} | Name: ${r.name} | Status: ${r.approvalStatus} | Created: ${r.createdAt} | SuggestedBy: ${r.suggestedBy} | Reason: ${r.rejectionReason || 'N/A'}`);
                });
            }
        }

        // 2. DUPLICATE DETECTION
        console.log('\n[2] DUPLICATE DETECTION:');
        for (const coll of collections) {
            const duplicates = await db.collection(coll).aggregate([
                { $group: { _id: "$name", count: { $sum: 1 }, ids: { $push: "$_id" } } },
                { $match: { count: { $gt: 1 } } }
            ]).toArray();
            
            if (duplicates.length > 0) {
                console.log(`\nExact Duplicates in ${coll}:`);
                duplicates.forEach(d => console.log(`- "${d._id}": ${d.count} occurrences | IDs: ${d.ids.join(', ')}`));
            }
        }

        // 3. NEAR-DUPLICATE DETECTION (Case insensitive / Trimmed)
        console.log('\n[3] NEAR-DUPLICATE DETECTION:');
        for (const coll of collections) {
            const nearDuplicates = await db.collection(coll).aggregate([
                { $project: { normalizedName: { $trim: { input: { $toLower: "$name" } } } } },
                { $group: { _id: "$normalizedName", count: { $sum: 1 }, originalNames: { $addToSet: "$name" } } },
                { $match: { count: { $gt: 1 } } }
            ]).toArray();

            if (nearDuplicates.length > 0) {
                const multiVariations = nearDuplicates.filter(d => d.originalNames.length > 1);
                if (multiVariations.length > 0) {
                    console.log(`\nNear-Duplicates (Variations) in ${coll}:`);
                    multiVariations.forEach(d => console.log(`- "${d._id}": Found variations: [${d.originalNames.join(', ')}]`));
                }
            }
        }

        // 4. ORPHAN ANALYSIS
        console.log('\n[4] ORPHAN ANALYSIS:');
        // Check Brands without Categories
        const orphanBrands = await db.collection('brands').countDocuments({
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } },
                { categoryIds: null }
            ],
            isDeleted: false
        });
        console.log(`Orphan Brands (No Categories): ${orphanBrands}`);

        // Check Models without Brands
        const orphanModels = await db.collection('models').countDocuments({
            brandId: { $exists: false },
            isDeleted: false
        });
        console.log(`Orphan Models (No Brand): ${orphanModels}`);

        // 5. UNUSED RECORDS
        console.log('\n[5] UNUSED RECORDS (Non-Approved & No Listings):');
        const ads = await db.collection('ads').find({}, { projection: { modelId: 1, brandId: 1, categoryId: 1 } }).toArray();
        const usedModelIds = new Set(ads.filter(a => a.modelId).map(a => a.modelId.toString()));
        const usedBrandIds = new Set(ads.filter(a => a.brandId).map(a => a.brandId.toString()));

        const unusedModels = await db.collection('models').find({
            approvalStatus: { $ne: 'approved' },
            isDeleted: false
        }).toArray();
        
        const trulyUnusedModels = unusedModels.filter(m => !usedModelIds.has(m._id.toString()));
        console.log(`Unused Non-Approved Models: ${trulyUnusedModels.length}`);
        trulyUnusedModels.forEach(m => console.log(`- ${m.name} (${m._id})`));

        const unusedBrands = await db.collection('brands').find({
            approvalStatus: { $ne: 'approved' },
            isDeleted: false
        }).toArray();
        const trulyUnusedBrands = unusedBrands.filter(b => !usedBrandIds.has(b._id.toString()));
        console.log(`Unused Non-Approved Brands: ${trulyUnusedBrands.length}`);
        trulyUnusedBrands.forEach(b => console.log(`- ${b.name} (${b._id})`));

        // 6. LISTING SAFETY CHECK
        console.log('\n[6] LISTING SAFETY CHECK:');
        const liveAdsWithMissingModels = [];
        for (const ad of ads.filter(a => a.modelId)) {
            const exists = await db.collection('models').findOne({ _id: ad.modelId });
            if (!exists) liveAdsWithMissingModels.push(ad._id);
        }
        console.log(`Live Ads referencing MISSING Models: ${liveAdsWithMissingModels.length}`);

    } catch (err) {
        console.error('Analysis failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

analyzeGovernance();
