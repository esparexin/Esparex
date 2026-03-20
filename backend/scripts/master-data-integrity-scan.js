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

const isActiveCategory = (category) => {
    if (!category) return false;
    const status = category.status;
    if (status === 'inactive' || status === 'rejected') return false;
    return category.isActive === true;
};

const isActiveBrand = (brand) => {
    if (!brand) return false;
    if (brand.status && brand.status !== 'active') return false;
    return brand.isActive === true;
};

const isActiveModel = (model) => {
    if (!model) return false;
    if (model.status && model.status !== 'active') return false;
    return model.isActive === true;
};

async function run() {
    await mongoose.connect(adminUri, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;

    const [categories, brands, models, spareParts, screenSizes] = await Promise.all([
        db.collection('categories').find({ isDeleted: { $ne: true } }).project({ name: 1, isActive: 1, status: 1 }).toArray(),
        db.collection('brands').find({ isDeleted: { $ne: true } }).project({ name: 1, categoryIds: 1, isActive: 1, status: 1 }).toArray(),
        db.collection('models').find({ isDeleted: { $ne: true } }).project({ name: 1, brandId: 1, categoryId: 1, isActive: 1, status: 1 }).toArray(),
        db.collection('spareparts').find({ isDeleted: { $ne: true } }).project({ name: 1, categories: 1, brandId: 1, modelId: 1, isActive: 1, status: 1 }).toArray(),
        db.collection('screensizes').find({ isDeleted: { $ne: true } }).project({ name: 1, size: 1, categoryId: 1, brandId: 1, isActive: 1 }).toArray()
    ]);

    const categoryMap = new Map(categories.map((doc) => [normalizeId(doc._id), doc]));
    const brandMap = new Map(brands.map((doc) => [normalizeId(doc._id), doc]));
    const modelMap = new Map(models.map((doc) => [normalizeId(doc._id), doc]));

    const activeCategoryIds = new Set(
        categories
            .filter(isActiveCategory)
            .map((doc) => normalizeId(doc._id))
            .filter(Boolean)
    );

    const activeBrandIds = new Set(
        brands
            .filter(isActiveBrand)
            .map((doc) => normalizeId(doc._id))
            .filter(Boolean)
    );

    const activeModelIds = new Set(
        models
            .filter(isActiveModel)
            .map((doc) => normalizeId(doc._id))
            .filter(Boolean)
    );

    const brokenBrands = [];
    for (const brand of brands) {
        const brandId = normalizeId(brand._id);
        const categoryIds = Array.isArray(brand.categoryIds) ? brand.categoryIds.map(normalizeId).filter(Boolean) : [];
        const missingCategories = categoryIds.filter((id) => !categoryMap.has(id));
        const inactiveCategories = categoryIds.filter((id) => {
            const category = categoryMap.get(id);
            return category ? !isActiveCategory(category) : false;
        });

        if (categoryIds.length === 0 || missingCategories.length > 0 || inactiveCategories.length > 0) {
            brokenBrands.push({
                _id: brandId,
                name: brand.name,
                categoryIds,
                missingCategories,
                inactiveCategories
            });
        }
    }

    const brokenModels = [];
    for (const model of models) {
        const modelId = normalizeId(model._id);
        const brandId = normalizeId(model.brandId);
        const categoryId = normalizeId(model.categoryId);
        const brand = brandMap.get(brandId);
        const category = categoryMap.get(categoryId);

        const issues = {
            missingBrand: !brand,
            inactiveBrand: brand ? !isActiveBrand(brand) : false,
            missingCategory: !category,
            inactiveCategory: category ? !isActiveCategory(category) : false,
            brandCategoryMismatch: false
        };

        if (brand && categoryId) {
            const brandCategoryIds = Array.isArray(brand.categoryIds)
                ? brand.categoryIds.map(normalizeId).filter(Boolean)
                : [];
            issues.brandCategoryMismatch = !brandCategoryIds.includes(categoryId);
        }

        if (issues.missingBrand || issues.inactiveBrand || issues.missingCategory || issues.inactiveCategory || issues.brandCategoryMismatch) {
            brokenModels.push({
                _id: modelId,
                name: model.name,
                brandId,
                categoryId,
                issues
            });
        }
    }

    const brokenSpareParts = [];
    for (const sparePart of spareParts) {
        const sparePartId = normalizeId(sparePart._id);
        const categoryIds = Array.isArray(sparePart.categories) ? sparePart.categories.map(normalizeId).filter(Boolean) : [];
        const brandId = normalizeId(sparePart.brandId);
        const modelId = normalizeId(sparePart.modelId);
        const model = modelId ? modelMap.get(modelId) : null;

        const missingCategories = categoryIds.filter((id) => !categoryMap.has(id));
        const inactiveCategories = categoryIds.filter((id) => {
            const category = categoryMap.get(id);
            return category ? !isActiveCategory(category) : false;
        });

        const issues = {
            noCategories: categoryIds.length === 0,
            missingCategories,
            inactiveCategories,
            inactiveBrand: brandId ? !activeBrandIds.has(brandId) : false,
            inactiveModel: modelId ? !activeModelIds.has(modelId) : false,
            modelCategoryMismatch: false,
            modelBrandMismatch: false
        };

        if (model) {
            const modelCategoryId = normalizeId(model.categoryId);
            const modelBrandId = normalizeId(model.brandId);
            if (modelCategoryId) {
                issues.modelCategoryMismatch = !categoryIds.includes(modelCategoryId);
            }
            if (brandId && modelBrandId) {
                issues.modelBrandMismatch = brandId !== modelBrandId;
            }
        }

        if (
            issues.noCategories
            || issues.missingCategories.length > 0
            || issues.inactiveCategories.length > 0
            || issues.inactiveBrand
            || issues.inactiveModel
            || issues.modelCategoryMismatch
            || issues.modelBrandMismatch
        ) {
            brokenSpareParts.push({
                _id: sparePartId,
                name: sparePart.name,
                categories: categoryIds,
                brandId,
                modelId,
                issues
            });
        }
    }

    const brokenScreenSizes = [];
    for (const screenSize of screenSizes) {
        const screenSizeId = normalizeId(screenSize._id);
        const categoryId = normalizeId(screenSize.categoryId);
        const brandId = normalizeId(screenSize.brandId);
        const category = categoryId ? categoryMap.get(categoryId) : null;

        const issues = {
            missingCategory: !category,
            inactiveCategory: category ? !isActiveCategory(category) : false,
            inactiveBrand: brandId ? !activeBrandIds.has(brandId) : false
        };

        if (issues.missingCategory || issues.inactiveCategory || issues.inactiveBrand) {
            brokenScreenSizes.push({
                _id: screenSizeId,
                name: screenSize.name,
                size: screenSize.size,
                categoryId,
                brandId,
                issues
            });
        }
    }

    const report = {
        scannedAt: new Date().toISOString(),
        database: mongoose.connection.name,
        totals: {
            categories: categories.length,
            brands: brands.length,
            models: models.length,
            spareParts: spareParts.length,
            screenSizes: screenSizes.length
        },
        activeTotals: {
            categories: activeCategoryIds.size,
            brands: activeBrandIds.size,
            models: activeModelIds.size
        },
        broken: {
            brands: brokenBrands,
            models: brokenModels,
            spareParts: brokenSpareParts,
            screenSizes: brokenScreenSizes
        },
        brokenCounts: {
            brands: brokenBrands.length,
            models: brokenModels.length,
            spareParts: brokenSpareParts.length,
            screenSizes: brokenScreenSizes.length
        }
    };

    console.log(JSON.stringify(report, null, 2));

    await mongoose.disconnect();
}

run().catch(async (error) => {
    console.error('[master-data-integrity-scan] failed:', error instanceof Error ? error.message : String(error));
    try {
        await mongoose.disconnect();
    } catch (_error) {
        // no-op
    }
    process.exit(1);
});
