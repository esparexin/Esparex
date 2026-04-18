import mongoose from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import Category, { ICategory } from '../../models/Category';
import Brand from '../../models/Brand';
import ProductModel from '../../models/Model';
import CatalogOrchestrator from '../catalog/CatalogOrchestrator';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

const dedupeObjectIds = (ids: Array<string | mongoose.Types.ObjectId | undefined | null>): mongoose.Types.ObjectId[] => {
    const deduped = new Map<string, mongoose.Types.ObjectId>();
    for (const rawId of ids) {
        if (!rawId) continue;
        const id = rawId instanceof mongoose.Types.ObjectId ? rawId.toString() : String(rawId);
        if (mongoose.Types.ObjectId.isValid(id) && !deduped.has(id)) {
            deduped.set(id, new mongoose.Types.ObjectId(id));
        }
    }
    return Array.from(deduped.values());
};

export class CatalogImportService {
    static async importCategories(data: Partial<ICategory>[]): Promise<ImportResult> {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };
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
                const bulkRes = await Category.bulkWrite(ops);
                result.success = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            }
        } catch (error) {
            result.failed = data.length;
            result.errors.push(`Bulk category import failed: ${String(error)}`);
        }
        return result;
    }

    static async importBrands(data: { name: string, categories: string[] }[]): Promise<ImportResult> {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };
        
        try {
            const allCategories = await Category.find({}, { _id: 1, name: 1 }).lean<{ _id: mongoose.Types.ObjectId, name: string }[]>();
            const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c._id]));

            const allBrands = await Brand.find({}).setOptions({ withDeleted: true }).lean<{ _id: mongoose.Types.ObjectId, name: string, categoryIds?: mongoose.Types.ObjectId[] }[]>();
            const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b]));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ops: any[] = [];

            for (const item of data) {
                const categoryIds = item.categories
                    .map(name => categoryMap.get(name.toLowerCase()))
                    .filter((id): id is mongoose.Types.ObjectId => !!id);

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
                                    status: CATALOG_STATUS.ACTIVE
                                }
                            }
                        }
                    });
                } else {
                    ops.push({
                        insertOne: {
                            document: {
                                name: item.name,
                                slug: slugify(item.name, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
                                categoryIds: dedupeObjectIds(categoryIds),
                                isActive: true,
                                status: CATALOG_STATUS.ACTIVE
                            }
                        }
                    });
                }
            }

            if (ops.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const bulkRes = await Brand.bulkWrite(ops);
                result.success = (bulkRes.insertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.upsertedCount || 0);
            }
        } catch (error) {
            result.errors.push(`Bulk brand import failed: ${String(error)}`);
        }
        return result;
    }

    static async importModels(data: { name: string, brand: string, category?: string }[]): Promise<ImportResult> {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        try {
            const allCategories = await Category.find({}, { _id: 1, name: 1 }).lean<{ _id: mongoose.Types.ObjectId, name: string }[]>();
            const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c._id]));

            const allBrands = await Brand.find({}, { _id: 1, name: 1, categoryIds: 1 }).lean<{ _id: mongoose.Types.ObjectId, name: string, categoryIds?: mongoose.Types.ObjectId[] }[]>();
            const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b]));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ops: any[] = [];

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
                                status: CATALOG_STATUS.ACTIVE
                            }
                        },
                        upsert: true
                    }
                });
            }

            if (ops.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const bulkRes = await ProductModel.bulkWrite(ops);
                result.success = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            }
            await CatalogOrchestrator.invalidateCatalogCache();
        } catch (error) {
            result.errors.push(`Bulk model import failed: ${String(error)}`);
        }
        return result;
    }

    static async seedDevices(devices: { type: string, brand: string, name: string, specs?: Record<string, unknown> }[]): Promise<ImportResult> {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        try {
            const types = [...new Set(devices.map((d) => d.type))];
            const categoryMap: Record<string, mongoose.Types.ObjectId> = {};

            for (const type of types) {
                const slugMap: Record<string, string> = {
                    smartphone: 'mobiles',
                    tablet: 'tablets',
                    laptop: 'laptops',
                    tv: 'led-tvs',
                    monitor: 'monitors',
                };
                const nameMap: Record<string, string> = {
                    smartphone: 'Mobiles',
                    tablet: 'Tablets',
                    laptop: 'Laptops',
                    tv: 'LED TVs',
                    monitor: 'Monitors',
                };
                const slug = slugMap[type.toLowerCase()] ?? (type.toLowerCase().endsWith('s') ? type.toLowerCase() : `${type.toLowerCase()}s`);
                const name = nameMap[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1) + (type.toLowerCase().endsWith('s') ? '' : 's'));

                const hasScreenSizes = ['tv', 'monitor'].includes(type.toLowerCase());

                const cat = await Category.findOneAndUpdate(
                    { slug },
                    { name, slug, isActive: true, hasScreenSizes },
                    { upsert: true, new: true }
                );
                categoryMap[type.toLowerCase()] = cat._id;
            }

            // Seed devices is more complex for bulk due to brand-model dependency. 
            // Keeping it sequential for now since it's a internal seeder, not a high-volume public import.
            for (const device of devices) {
                 const catId = categoryMap[device.type.toLowerCase()];
                 const brandSlug = device.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                 const brand = await Brand.findOneAndUpdate(
                    { name: { $regex: new RegExp(`^${device.brand}$`, 'i') } },
                    {
                        $setOnInsert: { name: device.brand, slug: brandSlug, isActive: true, status: CATALOG_STATUS.ACTIVE },
                        $addToSet: { categoryIds: catId }
                    },
                    { upsert: true, new: true }
                );
                await ProductModel.findOneAndUpdate(
                    { name: device.name, brandId: brand._id },
                    {
                        name: device.name,
                        brandId: brand._id,
                        categoryId: catId,
                        categoryIds: [catId],
                        isActive: true,
                        status: CATALOG_STATUS.ACTIVE,
                        specifications: device.specs || {}
                    },
                    { upsert: true, new: true }
                );
                result.success++;
            }

            await CatalogOrchestrator.invalidateCatalogCache();
        } catch (error) {
            result.errors.push(`Device seeding failed: ${String(error)}`);
        }
        return result;
    }
}
