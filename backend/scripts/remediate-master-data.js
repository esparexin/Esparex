#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const adminUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esparex_admin';

const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
    return null;
};

const normalizeText = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const classifyCategory = (category) => {
    const source = `${category?.slug || ''} ${category?.name || ''}`;
    const text = normalizeText(source);

    if (/(smart\s*phone|smartphone|mobile|phones)/.test(text)) return 'mobile';
    if (/(tablet|ipad)/.test(text)) return 'tablet';
    if (/(tv|television|monitor)/.test(text)) return 'tv';
    if (/(laptop|notebook)/.test(text)) return 'laptop';
    return null;
};

const dedupeIds = (ids) => {
    const seen = new Set();
    const out = [];
    for (const id of ids) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
};

const isActiveCategory = (category) => Boolean(
    category
    && category.isActive === true
    && category.status !== 'inactive'
    && category.status !== 'rejected'
);

async function run() {
    await mongoose.connect(adminUri, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;

    const categories = await db
        .collection('categories')
        .find({ isDeleted: { $ne: true } })
        .project({ name: 1, slug: 1, isActive: 1, status: 1 })
        .toArray();

    const categoryMap = new Map(categories.map((category) => [normalizeId(category._id), category]));

    const canonicalActiveByType = new Map();
    for (const category of categories) {
        const typeKey = classifyCategory(category);
        if (!typeKey) continue;
        if (!isActiveCategory(category)) continue;
        if (!canonicalActiveByType.has(typeKey)) {
            canonicalActiveByType.set(typeKey, normalizeId(category._id));
        }
    }

    const legacyCategoryMap = new Map();
    for (const category of categories) {
        const categoryId = normalizeId(category._id);
        const typeKey = classifyCategory(category);
        if (!categoryId || !typeKey) continue;
        if (isActiveCategory(category)) continue;

        const canonicalId = canonicalActiveByType.get(typeKey);
        if (canonicalId && canonicalId !== categoryId) {
            legacyCategoryMap.set(categoryId, canonicalId);
        }
    }

    const mapCategoryIds = (ids) => dedupeIds(
        (Array.isArray(ids) ? ids : [])
            .map((id) => normalizeId(id))
            .filter(Boolean)
            .map((id) => legacyCategoryMap.get(id) || id)
            .filter((id) => categoryMap.has(id))
    );

    let brandCategoryRemaps = 0;
    let brandCategoryBackfills = 0;
    let brandModelSyncAdds = 0;

    const brands = await db
        .collection('brands')
        .find({ isDeleted: { $ne: true } })
        .project({ _id: 1, categoryIds: 1 })
        .toArray();

    const models = await db
        .collection('models')
        .find({ isDeleted: { $ne: true } })
        .project({ _id: 1, brandId: 1, categoryId: 1, isActive: 1, status: 1 })
        .toArray();

    const modelCategoryByBrand = new Map();
    for (const model of models) {
        const brandId = normalizeId(model.brandId);
        const categoryId = normalizeId(model.categoryId);
        if (!brandId || !categoryId) continue;
        const mappedCategoryId = legacyCategoryMap.get(categoryId) || categoryId;
        if (!modelCategoryByBrand.has(brandId)) modelCategoryByBrand.set(brandId, new Set());
        modelCategoryByBrand.get(brandId).add(mappedCategoryId);
    }

    for (const brand of brands) {
        const brandId = normalizeId(brand._id);
        if (!brandId) continue;

        const originalCategoryIds = dedupeIds((Array.isArray(brand.categoryIds) ? brand.categoryIds : []).map(normalizeId).filter(Boolean));
        let nextCategoryIds = mapCategoryIds(originalCategoryIds);

        if (nextCategoryIds.length === 0) {
            const derived = Array.from(modelCategoryByBrand.get(brandId) || []);
            nextCategoryIds = mapCategoryIds(derived);
            if (nextCategoryIds.length > 0) {
                brandCategoryBackfills += 1;
            }
        }

        const derivedFromModels = Array.from(modelCategoryByBrand.get(brandId) || []);
        const merged = dedupeIds([...nextCategoryIds, ...mapCategoryIds(derivedFromModels)]);
        if (merged.length > nextCategoryIds.length) {
            brandModelSyncAdds += 1;
        }
        nextCategoryIds = merged;

        if (nextCategoryIds.length > 0 && JSON.stringify(nextCategoryIds) !== JSON.stringify(originalCategoryIds)) {
            await db.collection('brands').updateOne(
                { _id: brand._id },
                { $set: { categoryIds: nextCategoryIds } }
            );
            brandCategoryRemaps += 1;
        }
    }

    // Promote pending brand/model statuses to active to remove unresolved master-data gating.
    const brandPromoteResult = await db.collection('brands').updateMany(
        { status: 'pending', isDeleted: { $ne: true } },
        { $set: { status: 'active', isActive: true }, $unset: { rejectionReason: '' } }
    );

    let modelCategoryRemaps = 0;
    for (const model of models) {
        const modelCategoryId = normalizeId(model.categoryId);
        if (!modelCategoryId) continue;
        const mappedCategoryId = legacyCategoryMap.get(modelCategoryId);
        if (!mappedCategoryId || mappedCategoryId === modelCategoryId) continue;

        await db.collection('models').updateOne(
            { _id: model._id },
            { $set: { categoryId: new mongoose.Types.ObjectId(mappedCategoryId) } }
        );
        modelCategoryRemaps += 1;
    }

    const modelPromoteResult = await db.collection('models').updateMany(
        { status: 'pending', isDeleted: { $ne: true } },
        { $set: { status: 'active', isActive: true }, $unset: { rejectionReason: '' } }
    );

    const refreshedBrands = await db
        .collection('brands')
        .find({ isDeleted: { $ne: true } })
        .project({ _id: 1, categoryIds: 1 })
        .toArray();
    const refreshedBrandCategories = new Map(
        refreshedBrands.map((brand) => [normalizeId(brand._id), new Set(mapCategoryIds(brand.categoryIds))])
    );

    const refreshedModels = await db
        .collection('models')
        .find({ isDeleted: { $ne: true } })
        .project({ _id: 1, brandId: 1, categoryId: 1 })
        .toArray();
    const refreshedModelCategory = new Map(
        refreshedModels.map((model) => [normalizeId(model._id), normalizeId(model.categoryId)])
    );

    let sparePartCategoryRemaps = 0;
    let sparePartDerivedCategories = 0;
    let sparePartStatusPromotions = 0;

    const spareParts = await db
        .collection('spareparts')
        .find({ isDeleted: { $ne: true } })
        .project({ _id: 1, categories: 1, brandId: 1, modelId: 1, status: 1, isActive: 1 })
        .toArray();

    for (const sparePart of spareParts) {
        const originalCategoryIds = dedupeIds((Array.isArray(sparePart.categories) ? sparePart.categories : []).map(normalizeId).filter(Boolean));
        let nextCategoryIds = mapCategoryIds(originalCategoryIds);

        if (nextCategoryIds.length === 0) {
            const modelId = normalizeId(sparePart.modelId);
            const brandId = normalizeId(sparePart.brandId);
            const modelCategory = modelId ? refreshedModelCategory.get(modelId) : null;
            if (modelCategory) {
                nextCategoryIds = mapCategoryIds([modelCategory]);
            }
            if (nextCategoryIds.length === 0 && brandId && refreshedBrandCategories.has(brandId)) {
                nextCategoryIds = Array.from(refreshedBrandCategories.get(brandId));
            }
            if (nextCategoryIds.length > 0) {
                sparePartDerivedCategories += 1;
            }
        }

        const updates = {};

        if (nextCategoryIds.length > 0 && JSON.stringify(nextCategoryIds) !== JSON.stringify(originalCategoryIds)) {
            updates.categories = nextCategoryIds.map((id) => new mongoose.Types.ObjectId(id));
            sparePartCategoryRemaps += 1;
        }

        if (sparePart.status === 'pending') {
            updates.status = 'active';
            updates.isActive = true;
            sparePartStatusPromotions += 1;
        } else if (sparePart.isActive !== true && (sparePart.status === 'active' || sparePart.status === 'approved')) {
            // Accept both 'active' (canonical) and 'approved' (legacy) during transition
            updates.isActive = true;
        }

        if (Object.keys(updates).length > 0) {
            await db.collection('spareparts').updateOne({ _id: sparePart._id }, { $set: updates });
        }
    }

    const screenSizes = await db
        .collection('screensizes')
        .find({ isDeleted: { $ne: true } })
        .project({ _id: 1, categoryId: 1 })
        .toArray();
    let screenSizeCategoryRemaps = 0;
    for (const screenSize of screenSizes) {
        const categoryId = normalizeId(screenSize.categoryId);
        if (!categoryId) continue;
        const mappedCategoryId = legacyCategoryMap.get(categoryId);
        if (!mappedCategoryId || mappedCategoryId === categoryId) continue;

        await db.collection('screensizes').updateOne(
            { _id: screenSize._id },
            { $set: { categoryId: new mongoose.Types.ObjectId(mappedCategoryId) } }
        );
        screenSizeCategoryRemaps += 1;
    }

    const pendingCounts = {
        brands: await db.collection('brands').countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
        models: await db.collection('models').countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
        spareParts: await db.collection('spareparts').countDocuments({ status: 'pending', isDeleted: { $ne: true } })
    };

    const publicVisibleSpareParts = await db.collection('spareparts').countDocuments({
        status: { $in: ['active', 'approved'] }, // 'approved' kept for backwards compat until migration runs
        isActive: true,
        isDeleted: { $ne: true }
    });

    const summary = {
        legacyCategoryMappings: Array.from(legacyCategoryMap.entries()),
        brandCategoryRemaps,
        brandCategoryBackfills,
        brandModelSyncAdds,
        brandPromotedFromPending: brandPromoteResult.modifiedCount,
        modelCategoryRemaps,
        modelPromotedFromPending: modelPromoteResult.modifiedCount,
        sparePartCategoryRemaps,
        sparePartDerivedCategories,
        sparePartPromotedFromPending: sparePartStatusPromotions,
        screenSizeCategoryRemaps,
        pendingCounts,
        publicVisibleSpareParts
    };

    // Activate categories that are still referenced by active master records.
    const referencedCategoryIds = new Set();
    const activeCategoriesCursor = db.collection('categories').find({ isDeleted: { $ne: true } }).project({ _id: 1 });
    for await (const category of activeCategoriesCursor) {
        const categoryId = normalizeId(category._id);
        if (categoryId) referencedCategoryIds.add(categoryId);
    }

    const addReferencedIds = (ids) => {
        for (const rawId of ids || []) {
            const normalized = normalizeId(rawId);
            if (normalized) referencedCategoryIds.add(normalized);
        }
    };

    const brandsForRefs = await db.collection('brands').find({ isDeleted: { $ne: true } }).project({ categoryIds: 1 }).toArray();
    for (const brand of brandsForRefs) addReferencedIds(brand.categoryIds);

    const modelsForRefs = await db.collection('models').find({ isDeleted: { $ne: true } }).project({ categoryId: 1 }).toArray();
    for (const model of modelsForRefs) addReferencedIds([model.categoryId]);

    const spareForRefs = await db.collection('spareparts').find({ isDeleted: { $ne: true } }).project({ categories: 1 }).toArray();
    for (const sparePart of spareForRefs) addReferencedIds(sparePart.categories);

    const screenForRefs = await db.collection('screensizes').find({ isDeleted: { $ne: true } }).project({ categoryId: 1 }).toArray();
    for (const screenSize of screenForRefs) addReferencedIds([screenSize.categoryId]);

    const categoryActivationResult = await db.collection('categories').updateMany(
        {
            _id: { $in: Array.from(referencedCategoryIds).map((id) => new mongoose.Types.ObjectId(id)) },
            $or: [{ isActive: { $ne: true } }, { status: { $ne: 'active' } }],
            isDeleted: { $ne: true }
        },
        { $set: { isActive: true, status: 'active' } }
    );
    summary.categoriesActivatedByReference = categoryActivationResult.modifiedCount;

    // Activate brands that are referenced by models/screensizes/spare parts.
    const referencedBrandIds = new Set();
    const addReferencedBrandIds = (ids) => {
        for (const rawId of ids || []) {
            const normalized = normalizeId(rawId);
            if (normalized) referencedBrandIds.add(normalized);
        }
    };

    const modelBrandRefs = await db.collection('models').find({ isDeleted: { $ne: true } }).project({ brandId: 1 }).toArray();
    for (const model of modelBrandRefs) addReferencedBrandIds([model.brandId]);

    const spareBrandRefs = await db.collection('spareparts').find({ isDeleted: { $ne: true } }).project({ brandId: 1 }).toArray();
    for (const sparePart of spareBrandRefs) addReferencedBrandIds([sparePart.brandId]);

    const screenBrandRefs = await db.collection('screensizes').find({ isDeleted: { $ne: true } }).project({ brandId: 1 }).toArray();
    for (const screenSize of screenBrandRefs) addReferencedBrandIds([screenSize.brandId]);

    if (referencedBrandIds.size > 0) {
        const brandActivationResult = await db.collection('brands').updateMany(
            {
                _id: { $in: Array.from(referencedBrandIds).map((id) => new mongoose.Types.ObjectId(id)) },
                $or: [{ isActive: { $ne: true } }, { status: { $ne: 'active' } }],
                isDeleted: { $ne: true }
            },
            { $set: { isActive: true, status: 'active' }, $unset: { rejectionReason: '' } }
        );
        summary.brandsActivatedByReference = brandActivationResult.modifiedCount;
    } else {
        summary.brandsActivatedByReference = 0;
    }

    console.log(JSON.stringify(summary, null, 2));

    await mongoose.disconnect();
}

run().catch(async (error) => {
    console.error('[remediate-master-data] failed:', error instanceof Error ? error.message : String(error));
    try {
        await mongoose.disconnect();
    } catch (_error) {
        // no-op
    }
    process.exit(1);
});
