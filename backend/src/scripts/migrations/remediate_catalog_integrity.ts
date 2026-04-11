import mongoose from 'mongoose';
import { connectDB, getAdminConnection } from '../../config/db';
import logger from '../../utils/logger';

/**
 * remediateCatalogIntegrity
 * 
 * Repairs broken links between Categories, Brands, Models, and Spare Parts.
 * Uses raw MongoDB driver to bypass Mongoose schema restrictions/hooks.
 */
async function remediateCatalogIntegrity() {
    const isDryRun = process.env.DRY_RUN === 'true';
    const CATEGORY_IDS = {
        TABLETS: '69896257820e62e091a7c2f2',
        LAPTOPS: '69896257820e62e091a7c2f3',
        MOBILES: '69c24a14a58d20c75c6b09d8',
        TV: '69c24a14a58d20c75c6b09d9'
    };

    try {
        await connectDB();
        const db = getAdminConnection().db as any;
        logger.info(`Starting Raw Catalog Integrity Remediation ${isDryRun ? '(DRY RUN)' : ''}...`);

        // --- 0. Global Activation ---
        logger.info('Activating all non-deleted Catalog items...');
        if (!isDryRun) {
            await Promise.all([
                db.collection('categories').updateMany({ isDeleted: { $ne: true }, isActive: false }, { $set: { isActive: true, status: 'active' } }),
                db.collection('brands').updateMany({ isDeleted: { $ne: true }, isActive: false }, { $set: { isActive: true, status: 'active' } }),
                db.collection('models').updateMany({ isDeleted: { $ne: true }, isActive: false }, { $set: { isActive: true, status: 'live' } }),
                db.collection('spareparts').updateMany({ isDeleted: { $ne: true }, isActive: false }, { $set: { isActive: true, status: 'live' } }),
            ]);
        }

        // --- 1. Fix Spare Parts ---
        const spareParts = await db.collection('spareparts').find({ isDeleted: { $ne: true } }).toArray();
        let spCount = 0;
        for (const sp of spareParts) {
            const categories = Array.isArray(sp.categories) ? sp.categories : [];
            const categoryIds = Array.isArray(sp.categoryIds) ? sp.categoryIds : [];
            
            if (categories.length === 0 || categoryIds.length === 0) {
                spCount++;
                logger.info(`Repairing Spare Part: ${sp.name} -> Mapping to Mobiles`);
                if (!isDryRun) {
                    await db.collection('spareparts').updateOne(
                        { _id: sp._id },
                        { 
                            $set: { 
                                categoryIds: [new mongoose.Types.ObjectId(CATEGORY_IDS.MOBILES)],
                                categories: [new mongoose.Types.ObjectId(CATEGORY_IDS.MOBILES)],
                                isActive: true,
                                status: 'live'
                            } 
                        }
                    );
                }
            }
        }
        logger.info(`Processed ${spCount} Spare Part repairs.`);

        // --- 2. Fix Models ---
        const brands = await db.collection('brands').find().toArray();
        const brandMap = new Map(brands.map((b: any) => [b._id.toString(), b]));
        const categories = await db.collection('categories').find({ isDeleted: { $ne: true } }).toArray();
        const activeCategoryIds = new Set(categories.map((c: any) => c._id.toString()));

        const models = await db.collection('models').find({ isDeleted: { $ne: true } }).toArray();
        let modelCount = 0;

        for (const m of models) {
            const brand = brandMap.get(m.brandId?.toString());
            const brandCategoryIds = brand ? ((brand as any).categoryIds || []).map((id: any) => id.toString()) : [];
            const currentCatId = m.categoryId?.toString();

            const isMissingBrand = !brand;
            const isMissingCat = !currentCatId || !activeCategoryIds.has(currentCatId);
            const isMismatch = brand && currentCatId && !brandCategoryIds.includes(currentCatId);

            if (isMissingBrand || isMissingCat || isMismatch) {
                const name = m.name.toLowerCase();
                let targetCatId = brandCategoryIds[0] || CATEGORY_IDS.MOBILES;

                if (name.includes('tv') || name.includes('qled') || name.includes('bravia')) {
                    if (brandCategoryIds.includes(CATEGORY_IDS.TV)) targetCatId = CATEGORY_IDS.TV;
                } else if (name.includes('book') || name.includes('laptop')) {
                    if (brandCategoryIds.includes(CATEGORY_IDS.LAPTOPS)) targetCatId = CATEGORY_IDS.LAPTOPS;
                } else if (name.includes('phone') || name.includes('galaxy') || name.includes('iphone')) {
                    if (brandCategoryIds.includes(CATEGORY_IDS.MOBILES)) targetCatId = CATEGORY_IDS.MOBILES;
                }

                modelCount++;
                logger.info(`Repairing Model: ${m.name} | Reason: ${isMissingBrand ? 'NoBrand' : isMissingCat ? 'NoCat' : 'Mismatch'} -> Target: ${targetCatId}`);
                if (!isDryRun) {
                    await db.collection('models').updateOne(
                        { _id: m._id },
                        { 
                            $set: { 
                                categoryId: new mongoose.Types.ObjectId(targetCatId),
                                categoryIds: [new mongoose.Types.ObjectId(targetCatId)],
                                isActive: true,
                                status: 'live'
                            } 
                        }
                    );
                }
            }
        }
        logger.info(`Processed ${modelCount} Model repairs.`);

    } catch (error) {
        logger.error('Remediation Script Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Execute if run directly
if (require.main === module) {
    remediateCatalogIntegrity();
}

export default remediateCatalogIntegrity;
