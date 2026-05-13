const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user';

// Setup audit logging
const LOG_DIR = path.join(__dirname, '..', '..', '..', 'logs');
const AUDIT_LOG_FILE = path.join(LOG_DIR, 'taxonomy-cleanup-audit.log');

function logAudit(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        fs.appendFileSync(AUDIT_LOG_FILE, formattedMessage);
    } catch (err) {
        console.error('Failed to write to audit log:', err.message);
    }
}

async function executeCleanup() {
    const args = process.argv.slice(2);
    const isDryRun = !args.includes('--execute');
    const force = args.includes('--force');

    logAudit(`--- STARTING TAXONOMY GOVERNANCE CLEANUP (DryRun = ${isDryRun}, Force = ${force}) ---`);

    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        // Fetch all active categories to make script category-aware
        const categories = await db.collection('categories').find({ isDeleted: { $ne: true } }).toArray();
        const activeCategoryIds = new Set(categories.map(c => c._id.toString()));

        // Fetch active ads
        const ads = await db.collection('ads').find({}, { projection: { brandId: 1 } }).toArray();
        const usedBrandIds = new Set(ads.filter(a => a.brandId).map(a => a.brandId.toString()));

        // --- SECTION 1: ARCHIVE TEST/GARBAGE SUGGESTIONS ---
        const garbageNames = ['Potato', 'Mof', 'Cccc', 'Jamaka', 'Megaphone', 'Iplw', 'Kama', 'Sassd', 'Dd', 'Cc', 'Mog', 'Potao3'];
        
        logAudit('\n[1] Auditing Garbage Suggestions...');
        const candidateGarbageBrands = await db.collection('brands').find({
            name: { $in: garbageNames },
            approvalStatus: { $in: ['pending', 'rejected'] },
            isDeleted: { $ne: true }
        }).toArray();

        const candidateGarbageModels = await db.collection('models').find({
            name: { $in: garbageNames },
            approvalStatus: { $in: ['pending', 'rejected'] },
            isDeleted: { $ne: true }
        }).toArray();

        logAudit(`Found ${candidateGarbageBrands.length} garbage brands and ${candidateGarbageModels.length} garbage models to archive.`);

        if (!isDryRun && candidateGarbageBrands.length > 0) {
            const brandResult = await db.collection('brands').updateMany(
                { _id: { $in: candidateGarbageBrands.map(b => b._id) } },
                { $set: { isDeleted: true, deletedAt: new Date(), archivedInCleanup: true } }
            );
            logAudit(`Archived ${brandResult.modifiedCount} garbage brands.`);
        }

        if (!isDryRun && candidateGarbageModels.length > 0) {
            const modelResult = await db.collection('models').updateMany(
                { _id: { $in: candidateGarbageModels.map(m => m._id) } },
                { $set: { isDeleted: true, deletedAt: new Date(), archivedInCleanup: true } }
            );
            logAudit(`Archived ${modelResult.modifiedCount} garbage models.`);
        }

        // --- SECTION 2: ARCHIVE ORPHAN BRANDS (No valid category, not used in ads) ---
        logAudit('\n[2] Auditing Orphan Unused Brands...');
        
        // Find all active/non-deleted brands
        const allActiveBrands = await db.collection('brands').find({ isDeleted: { $ne: true } }).toArray();
        const totalActiveBrandsCount = allActiveBrands.length;

        const orphanBrandsToArchive = [];

        for (const brand of allActiveBrands) {
            // Check singular categoryId
            const hasValidSingular = brand.categoryId && activeCategoryIds.has(brand.categoryId.toString());
            
            // Check plural categoryIds array
            const hasValidPlural = Array.isArray(brand.categoryIds) && brand.categoryIds.some(id => activeCategoryIds.has(id.toString()));

            const isUsedInAds = usedBrandIds.has(brand._id.toString());

            // A brand is an orphan ONLY if it has NO valid category mapping in BOTH categoryId and categoryIds
            const isOrphan = !hasValidSingular && !hasValidPlural;

            if (isOrphan && !isUsedInAds) {
                orphanBrandsToArchive.push(brand);
            }
        }

        logAudit(`Found ${orphanBrandsToArchive.length} orphaned unused brands (out of ${totalActiveBrandsCount} active brands).`);

        if (orphanBrandsToArchive.length > 0) {
            const percentAffected = (orphanBrandsToArchive.length / totalActiveBrandsCount) * 100;
            logAudit(`Safety Check: Cleanup would affect ${percentAffected.toFixed(2)}% of active brands.`);

            if (percentAffected > 10.0 && !force) {
                logAudit(`⚠️ WARNING: Cleanup exceeds 10% safety threshold of active brands. Dry-run safety aborted cleanup execution.`);
                logAudit(`💡 Action required: Re-run with '--force' to bypass safety limits or investigate brand data.`);
                if (!isDryRun) {
                    throw new Error('Aborted: Exceeded safety threshold (10%) of active brands');
                }
            }

            if (!isDryRun) {
                const brandIdsToArchive = orphanBrandsToArchive.map(b => b._id);
                const archiveResult = await db.collection('brands').updateMany(
                    { _id: { $in: brandIdsToArchive } },
                    { $set: { isDeleted: true, deletedAt: new Date(), archivedInCleanup: true } }
                );
                logAudit(`Successfully archived ${archiveResult.modifiedCount} orphaned unused brands.`);
            } else {
                logAudit(`[Dry Run] Would archive brand names: ${orphanBrandsToArchive.map(b => b.name).join(', ')}`);
            }
        } else {
            logAudit('No orphaned unused brands found. Active catalog is healthy.');
        }

        // --- SECTION 3: NORMALIZATION BACKFILL (Search aliases) ---
        logAudit('\n[3] Adding Search Aliases for Top Brands...');
        const aliasUpdates = [
            { name: 'Apple', aliases: ['i-phone', 'i phone', 'macbook', 'ipad'] },
            { name: 'Samsung', aliases: ['galaxy', 's-series', 'note'] },
            { name: 'Google', aliases: ['pixel', 'nexus'] },
            { name: 'OnePlus', aliases: ['1plus', 'nord'] }
        ];

        for (const update of aliasUpdates) {
            if (!isDryRun) {
                const res = await db.collection('brands').updateOne(
                    { name: update.name, isDeleted: { $ne: true } },
                    { $addToSet: { aliases: { $each: update.aliases } } }
                );
                if (res.modifiedCount > 0) {
                    logAudit(`Updated aliases for ${update.name}`);
                }
            } else {
                logAudit(`[Dry Run] Would add search aliases for brand: ${update.name}`);
            }
        }

        logAudit(`\n--- CLEANUP PROCESS COMPLETED SUCCESSFULLY (DryRun = ${isDryRun}) ---`);

    } catch (err) {
        logAudit(`❌ Cleanup execution failed: ${err.message}`);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

executeCleanup();
