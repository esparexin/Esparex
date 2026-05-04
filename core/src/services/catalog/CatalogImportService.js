"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogImportService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const nanoid_1 = require("nanoid");
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const CatalogOrchestrator_1 = __importDefault(require("../catalog/CatalogOrchestrator"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const dedupeObjectIds = (ids) => {
    const deduped = new Map();
    for (const rawId of ids) {
        if (!rawId)
            continue;
        const id = rawId instanceof mongoose_1.default.Types.ObjectId ? rawId.toString() : String(rawId);
        if (mongoose_1.default.Types.ObjectId.isValid(id) && !deduped.has(id)) {
            deduped.set(id, new mongoose_1.default.Types.ObjectId(id));
        }
    }
    return Array.from(deduped.values());
};
class CatalogImportService {
    static async importCategories(data) {
        const result = { success: 0, failed: 0, errors: [] };
        const ops = data.filter(item => item.name && item.slug).map(item => ({
            updateOne: {
                filter: { slug: item.slug },
                update: {
                    $set: {
                        name: item.name,
                        icon: item.icon,
                        description: item.description,
                        isActive: true
                    }
                },
                upsert: true
            }
        }));
        try {
            if (ops.length > 0) {
                const bulkRes = await Category_1.default.bulkWrite(ops);
                result.success = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            }
        }
        catch (error) {
            result.failed = data.length;
            result.errors.push(`Bulk category import failed: ${String(error)}`);
        }
        return result;
    }
    static async importBrands(data) {
        const result = { success: 0, failed: 0, errors: [] };
        try {
            const allCategories = await Category_1.default.find({}, { _id: 1, name: 1 }).lean();
            const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c._id]));
            const allBrands = await Brand_1.default.find({}).setOptions({ withDeleted: true }).lean();
            const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b]));
            const ops = [];
            for (const item of data) {
                const categoryIds = item.categories
                    .map(name => categoryMap.get(name.toLowerCase()))
                    .filter((id) => !!id);
                if (categoryIds.length === 0) {
                    result.errors.push(`Brand '${item.name}': No valid categories found.`);
                    result.failed++;
                    continue;
                }
                const existingBrand = brandMap.get(item.name.toLowerCase());
                if (existingBrand) {
                    ops.push({
                        updateOne: {
                            filter: { _id: existingBrand._id },
                            update: {
                                $set: {
                                    categoryIds: dedupeObjectIds([...(existingBrand.categoryIds || []), ...categoryIds]),
                                    isDeleted: false,
                                    deletedAt: undefined,
                                    isActive: true,
                                    status: catalogStatus_1.CATALOG_STATUS.ACTIVE
                                }
                            }
                        }
                    });
                }
                else {
                    ops.push({
                        insertOne: {
                            document: {
                                name: item.name,
                                slug: (0, slugify_1.default)(item.name, { lower: true, strict: true, trim: true }) + '-' + (0, nanoid_1.nanoid)(5),
                                categoryIds: dedupeObjectIds(categoryIds),
                                isActive: true,
                                status: catalogStatus_1.CATALOG_STATUS.ACTIVE
                            }
                        }
                    });
                }
            }
            if (ops.length > 0) {
                const bulkRes = await Brand_1.default.bulkWrite(ops);
                result.success = (bulkRes.insertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.upsertedCount || 0);
            }
        }
        catch (error) {
            result.errors.push(`Bulk brand import failed: ${String(error)}`);
        }
        return result;
    }
    static async importModels(data) {
        const result = { success: 0, failed: 0, errors: [] };
        try {
            const allCategories = await Category_1.default.find({}, { _id: 1, name: 1 }).lean();
            const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c._id]));
            const allBrands = await Brand_1.default.find({}, { _id: 1, name: 1, categoryIds: 1 }).lean();
            const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b]));
            const ops = [];
            for (const item of data) {
                const brandRecord = brandMap.get(item.brand.toLowerCase());
                if (!brandRecord) {
                    result.errors.push(`Brand '${item.brand}' not found for model '${item.name}'`);
                    result.failed++;
                    continue;
                }
                let categoryId = item.category ? categoryMap.get(item.category.toLowerCase()) : null;
                if (!categoryId && brandRecord.categoryIds?.length) {
                    categoryId = brandRecord.categoryIds[0];
                }
                if (!categoryId) {
                    result.errors.push(`Model '${item.name}': Could not determine category.`);
                    result.failed++;
                    continue;
                }
                ops.push({
                    updateOne: {
                        filter: { name: item.name, brandId: brandRecord._id },
                        update: {
                            $set: {
                                name: item.name,
                                brandId: brandRecord._id,
                                categoryId: categoryId,
                                categoryIds: [categoryId],
                                isActive: true,
                                status: catalogStatus_1.CATALOG_STATUS.ACTIVE
                            }
                        },
                        upsert: true
                    }
                });
            }
            if (ops.length > 0) {
                const bulkRes = await Model_1.default.bulkWrite(ops);
                result.success = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            }
            await CatalogOrchestrator_1.default.invalidateCatalogCache();
        }
        catch (error) {
            result.errors.push(`Bulk model import failed: ${String(error)}`);
        }
        return result;
    }
    static async seedDevices(devices) {
        const result = { success: 0, failed: 0, errors: [] };
        try {
            const types = [...new Set(devices.map((d) => d.type))];
            const categoryMap = {};
            for (const type of types) {
                const slugMap = {
                    smartphone: 'mobiles',
                    tablet: 'tablets',
                    laptop: 'laptops',
                    tv: 'led-tvs',
                    monitor: 'monitors',
                };
                const nameMap = {
                    smartphone: 'Mobiles',
                    tablet: 'Tablets',
                    laptop: 'Laptops',
                    tv: 'LED TVs',
                    monitor: 'Monitors',
                };
                const slug = slugMap[type.toLowerCase()] ?? (type.toLowerCase().endsWith('s') ? type.toLowerCase() : `${type.toLowerCase()}s`);
                const name = nameMap[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1) + (type.toLowerCase().endsWith('s') ? '' : 's'));
                const hasScreenSizes = ['tv', 'monitor'].includes(type.toLowerCase());
                const cat = await Category_1.default.findOneAndUpdate({ slug }, { name, slug, isActive: true, hasScreenSizes }, { upsert: true, new: true });
                categoryMap[type.toLowerCase()] = cat._id;
            }
            // Seed devices is more complex for bulk due to brand-model dependency. 
            // Keeping it sequential for now since it's a internal seeder, not a high-volume public import.
            for (const device of devices) {
                const catId = categoryMap[device.type.toLowerCase()];
                const brandSlug = device.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const brand = await Brand_1.default.findOneAndUpdate({ name: { $regex: new RegExp(`^${device.brand}$`, 'i') } }, {
                    $setOnInsert: { name: device.brand, slug: brandSlug, isActive: true, status: catalogStatus_1.CATALOG_STATUS.ACTIVE },
                    $addToSet: { categoryIds: catId }
                }, { upsert: true, new: true });
                await Model_1.default.findOneAndUpdate({ name: device.name, brandId: brand._id }, {
                    name: device.name,
                    brandId: brand._id,
                    categoryId: catId,
                    categoryIds: [catId],
                    isActive: true,
                    status: catalogStatus_1.CATALOG_STATUS.ACTIVE,
                    specifications: device.specs || {}
                }, { upsert: true, new: true });
                result.success++;
            }
            await CatalogOrchestrator_1.default.invalidateCatalogCache();
        }
        catch (error) {
            result.errors.push(`Device seeding failed: ${String(error)}`);
        }
        return result;
    }
}
exports.CatalogImportService = CatalogImportService;
//# sourceMappingURL=CatalogImportService.js.map