import Category, { ICategory } from '../models/Category';
import Brand from '../models/Brand';
import ProductModel from '../models/Model';
import mongoose from 'mongoose';
import CatalogOrchestrator from './catalog/CatalogOrchestrator';
import { normalizeLocationInput } from '../utils/locationInputNormalizer';
import { CATALOG_STATUS } from '../../../shared/enums/catalogStatus';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

interface NamedCategoryRecord {
    _id: mongoose.Types.ObjectId;
    name: string;
}

interface NamedBrandRecord {
    _id: mongoose.Types.ObjectId;
    name: string;
    categoryIds?: mongoose.Types.ObjectId[];
}

interface LocationImportInput {
    name: string;
    city: string;
    state: string;
    level: string;
    coordinates: [number, number];
    isActive?: boolean;
    [key: string]: unknown;
}

interface DeviceSeedInput {
    type: string;
    brand: string;
    name: string;
    specs?: Record<string, unknown>;
}

export const bulkImportService = {
    /**
     * Import Categories
     * Expected format: { name: string, slug: string, icon?: string, description?: string }[]
     */
    importCategories: async (data: Partial<ICategory>[]): Promise<ImportResult> => {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        for (const item of data) {
            try {
                if (!item.name || !item.slug) {
                    throw new Error(`Missing name or slug for category: ${JSON.stringify(item)}`);
                }

                // Upsert based on slug
                await Category.findOneAndUpdate(
                    { slug: item.slug },
                    {
                        name: item.name,
                        icon: item.icon,
                        description: item.description,
                        isActive: true
                    },
                    { upsert: true, new: true }
                );
                result.success++;
            } catch (error: unknown) {
                const err = error as Error;
                result.failed++;
                result.errors.push(`Failed to import category '${item.name}': ${err.message}`);
            }
        }
        return result;
    },

    /**
     * Import Brands
     * Expected format: { name: string, categories: string[] }[]
     * 'categories' is a list of category NAMES (not IDs)
     */
    importBrands: async (data: { name: string, categories: string[] }[]): Promise<ImportResult> => {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        // Cache categories for performance
        const allCategories = await Category.find({}, { _id: 1, name: 1 }).lean<NamedCategoryRecord[]>();
        const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c._id]));

        for (const item of data) {
            try {
                if (!item.name || !item.categories || !Array.isArray(item.categories)) {
                    throw new Error(`Invalid brand data: ${JSON.stringify(item)}`);
                }

                // Resolve Category Names to IDs
                const categoryIds: mongoose.Types.ObjectId[] = [];
                for (const catName of item.categories) {
                    const catId = categoryMap.get(catName.toLowerCase());
                    if (catId) {
                        categoryIds.push(catId);
                    } else {
                        result.errors.push(`Brand '${item.name}': Category '${catName}' not found. Skipping this mapping.`);
                    }
                }

                if (categoryIds.length === 0) {
                    throw new Error(`No valid categories found for brand '${item.name}'`);
                }

                // Upsert based on name
                await Brand.findOneAndUpdate(
                    { name: item.name },
                    {
                        name: item.name,
                        categoryIds: categoryIds,
                        isActive: true
                    },
                    { upsert: true, new: true }
                );
                if (categoryIds.length > 1) {
                    result.errors.push(`Warning: Brand '${item.name}' was imported with ${categoryIds.length} categories. Only the first ('${item.categories[0]}') was applied. Brand schema supports one category only.`);
                }
                result.success++;
            } catch (error: unknown) {
                const err = error as Error;
                result.failed++;
                result.errors.push(`Failed to import brand '${item.name}': ${err.message}`);
            }
        }
        return result;
    },

    /**
     * Import Models
     * Expected format: { name: string, brand: string, category?: string }[]
     * Uses Names for brand and category lookup.
     */
    importModels: async (data: { name: string, brand: string, category?: string }[]): Promise<ImportResult> => {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        // Cache all masters (might be heavy for huge datasets, but okay for typical updates)
        const allCategories = await Category.find({}, { _id: 1, name: 1 }).lean<NamedCategoryRecord[]>();
        const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c._id]));

        const allBrands = await Brand.find({}, { _id: 1, name: 1, categoryIds: 1 }).lean<NamedBrandRecord[]>();
        const brandMap = new Map(allBrands.map((b) => [b.name.toLowerCase(), b._id]));

        for (const item of data) {
            try {
                if (!item.name || !item.brand) {
                    throw new Error(`Missing required fields (name, brand) for model: ${JSON.stringify(item)}`);
                }

                let categoryId = item.category ? categoryMap.get(item.category.toLowerCase()) : null;
                const brandId = brandMap.get(item.brand.toLowerCase());

                if (!brandId) throw new Error(`Brand '${item.brand}' not found`);

                // Auto-derive category if missing
                if (!categoryId) {
                    const derivedId = await CatalogOrchestrator.resolveCategoryIdFromBrand(brandId.toString());
                    if (derivedId) {
                        categoryId = new mongoose.Types.ObjectId(derivedId);
                    }
                }

                if (!categoryId) throw new Error(`Category mapping missing and could not be derived from brand '${item.brand}'`);

                // Verify Relationship if Category was provided
                if (item.category) {
                    const brandRecord = allBrands.find((b) => b._id.toString() === brandId.toString());
                    const isMapped = brandRecord?.categoryIds?.[0]?.toString() === categoryId?.toString();
    
                    if (!isMapped) {
                        result.errors.push(`Warning: Brand '${item.brand}' is mapped to a different category than provided '${item.category}'. Overriding to brand's first canonical category.`);
                        categoryId = brandRecord?.categoryIds?.[0] as mongoose.Types.ObjectId;
                    }
                }

                await ProductModel.findOneAndUpdate(
                    { name: item.name, brandId: brandId }, // Unique constraint usually on (name, brand)
                    {
                        name: item.name,
                        brandId: brandId,
                        categoryId: categoryId,
                        isActive: true,
                        status: CATALOG_STATUS.ACTIVE
                    },
                    { upsert: true, new: true }
                );
                result.success++;
            } catch (error: unknown) {
                const err = error as Error;
                result.failed++;
                result.errors.push(`Failed to import model '${item.name}': ${err.message}`);
            }
        }
        await CatalogOrchestrator.invalidateCatalogCache();
        return result;
    },

    /**
     * Import Locations
     * Expected format: { name, slug, city, state, country, level, coordinates: [lng, lat], isActive, isPopular, priority, tier, aliases }[]
     */
    importLocations: async (data: LocationImportInput[]): Promise<ImportResult> => {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };
        const Location = (await import('../models/Location')).default;

        for (const item of data) {
            try {
                if (!item.name || !item.city || !item.state || !item.level || !item.coordinates) {
                    throw new Error(`Missing required fields for location: ${JSON.stringify(item)}`);
                }

                const normalized = await normalizeLocationInput(
                    {
                        ...item,
                        coordinates: {
                            type: 'Point',
                            coordinates: item.coordinates
                        }
                    },
                    {
                        documentId: new mongoose.Types.ObjectId(),
                        resolveHierarchy: true,
                        ensureUnique: false,
                        defaultCountry: typeof item.country === 'string' ? item.country : 'Unknown'
                    }
                );

                await Location.findOneAndUpdate(
                    {
                        normalizedName: normalized.normalizedName,
                        state: normalized.state,
                        level: normalized.level,
                        ...(normalized.parentId ? { parentId: normalized.parentId } : {})
                    },
                    {
                        $setOnInsert: { _id: normalized.documentId },
                        $set: {
                            ...item,
                            name: normalized.name,
                            normalizedName: normalized.normalizedName,
                            slug: normalized.slug,
                            city: normalized.city,
                            state: normalized.state,
                            country: normalized.country,
                            level: normalized.level,
                            parentId: normalized.parentId,
                            path: normalized.path,
                            coordinates: normalized.coordinates,
                            aliases: normalized.aliases,
                            isActive: item.isActive !== undefined ? item.isActive : true
                        }
                    },
                    { upsert: true, new: true }
                );
                result.success++;
            } catch (error: unknown) {
                const err = error as Error;
                result.failed++;
                result.errors.push(`Failed to import location '${item.name}': ${err.message}`);
            }
        }
        return result;
    },

    /**
     * Seed Devices (Master Data Seeder)
     * Handles bulk creation of Brands and Models for Smartphones and Tablets.
     */
    seedDevices: async (devices: DeviceSeedInput[]): Promise<ImportResult> => {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };

        // 1. Resolve or Create Categories
        const types = [...new Set(devices.map((d) => d.type))];
        const categoryMap: Record<string, mongoose.Types.ObjectId> = {};

        for (const type of types) {
            // Slug handling
            let slug = type.toLowerCase().endsWith('s') ? type.toLowerCase() : `${type.toLowerCase()}s`;
            if (type.toLowerCase() === 'laptop') slug = 'laptops';
            if (type.toLowerCase() === 'tv') slug = 'smart-tv';

            const name = type.charAt(0).toUpperCase() + type.slice(1) + (type.toLowerCase().endsWith('s') ? '' : 's');

            const cat = await Category.findOneAndUpdate(
                { slug },
                { name, slug, isActive: true },
                { upsert: true, new: true }
            );
            categoryMap[type.toLowerCase()] = cat._id;
        }

        for (const device of devices) {
            try {
                const catId = categoryMap[device.type.toLowerCase()];
                if (!catId) throw new Error(`Invalid device type: ${device.type}`);

                // 2. Upsert Brand mapped to this single category
                const brand = await Brand.findOneAndUpdate(
                    { name: { $regex: new RegExp(`^${device.brand}$`, 'i') } },
                    {
                        $setOnInsert: { name: device.brand, isActive: true },
                        $set: { categoryIds: [catId] }
                    },
                    { upsert: true, new: true }
                );

                // 3. Upsert Model
                await ProductModel.findOneAndUpdate(
                    { name: device.name, brandId: brand._id },
                    {
                        name: device.name,
                        brandId: brand._id,
                        categoryId: catId,
                        isActive: true,
                        status: CATALOG_STATUS.ACTIVE,
                        specifications: device.specs || {}
                    },
                    { upsert: true, new: true }
                );
                result.success++;
            } catch (error: unknown) {
                const err = error as Error;
                result.failed++;
                result.errors.push(`Failed to seed ${device.name}: ${err.message}`);
            }
        }
        await CatalogOrchestrator.invalidateCatalogCache();
        return result;
    }
};
