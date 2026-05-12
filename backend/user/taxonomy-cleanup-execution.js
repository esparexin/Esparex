const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

async function executeCleanup() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;
        
        console.log('--- EXECUTING TAXONOMY GOVERNANCE CLEANUP ---');
        
        const testUserIds = [
            mongoose.Types.ObjectId.createFromHexString('69833a78f1ff3b80ecc010ab'),
            null,
            undefined
        ];

        // 1. Archive Test/Garbage Suggestions
        const garbageNames = ['Potato', 'Mof', 'Cccc', 'Jamaka', 'Megaphone', 'Iplw', 'Kama', 'Sassd', 'Dd', 'Cc', 'Mog', 'Potao3'];
        
        console.log('\n[1] Archiving Garbage Suggestions...');
        const brandResult = await db.collection('brands').updateMany(
            { 
                name: { $in: garbageNames },
                approvalStatus: { $in: ['pending', 'rejected'] }
            },
            { $set: { isDeleted: true, deletedAt: new Date(), archivedInCleanup: true } }
        );
        console.log(`Archived ${brandResult.modifiedCount} garbage brands.`);

        const modelResult = await db.collection('models').updateMany(
            { 
                name: { $in: garbageNames },
                approvalStatus: { $in: ['pending', 'rejected'] }
            },
            { $set: { isDeleted: true, deletedAt: new Date(), archivedInCleanup: true } }
        );
        console.log(`Archived ${modelResult.modifiedCount} garbage models.`);

        // 2. Archive Orphan Brands (No category, not used in ads)
        console.log('\n[2] Archiving Orphan Unused Brands...');
        const ads = await db.collection('ads').find({}, { projection: { brandId: 1 } }).toArray();
        const usedBrandIds = new Set(ads.filter(a => a.brandId).map(a => a.brandId.toString()));

        const orphans = await db.collection('brands').find({
            $or: [
                { categoryIds: { $exists: false } },
                { categoryIds: { $size: 0 } },
                { categoryIds: null }
            ],
            isDeleted: false
        }).toArray();

        let orphanArchiveCount = 0;
        for (const orphan of orphans) {
            if (!usedBrandIds.has(orphan._id.toString())) {
                await db.collection('brands').updateOne(
                    { _id: orphan._id },
                    { $set: { isDeleted: true, deletedAt: new Date(), archivedInCleanup: true } }
                );
                orphanArchiveCount++;
            }
        }
        console.log(`Archived ${orphanArchiveCount} orphaned unused brands.`);

        // 3. Normalization Backfill (Aliases/Synonyms for top brands)
        console.log('\n[3] Adding Search Aliases for Top Brands...');
        const aliasUpdates = [
            { name: 'Apple', aliases: ['i-phone', 'i phone', 'macbook', 'ipad'] },
            { name: 'Samsung', aliases: ['galaxy', 's-series', 'note'] },
            { name: 'Google', aliases: ['pixel', 'nexus'] },
            { name: 'OnePlus', aliases: ['1plus', 'nord'] }
        ];

        for (const update of aliasUpdates) {
            const res = await db.collection('brands').updateOne(
                { name: update.name, isDeleted: false },
                { $addToSet: { aliases: { $each: update.aliases } } }
            );
            if (res.modifiedCount > 0) console.log(`Updated aliases for ${update.name}`);
        }

    } catch (err) {
        console.error('Cleanup execution failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

executeCleanup();
