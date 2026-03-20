import Category from '../models/Category';
import Brand from '../models/Brand';
import Model from '../models/Model';
import mongoose from 'mongoose';
import { escapeRegExp } from './stringUtils';

/**
 * Normalization Utility: Resolves string-based master data to canonical ObjectIds.
 * Centralizes logic previously duplicated in adService to ensure consistency across Business, Service, and Ads.
 */

export interface MasterDataResolution {
    categoryId?: mongoose.Types.ObjectId;
    brandId?: mongoose.Types.ObjectId;
    modelId?: mongoose.Types.ObjectId;
}

export const resolveMasterDataIds = async (data: {
    category?: string;
    brand?: string;
    model?: string;
}): Promise<MasterDataResolution> => {
    const resolution: MasterDataResolution = {};

    // 1. Resolve Category
    if (data.category && data.category.length > 2) {
        if (mongoose.Types.ObjectId.isValid(data.category)) {
            resolution.categoryId = new mongoose.Types.ObjectId(data.category);
        } else {
            const cat = await Category.findOne({
                $or: [{ slug: data.category }, { name: data.category }]
            }).select('_id');
            if (cat) resolution.categoryId = cat._id as mongoose.Types.ObjectId;
        }
    }

    // 2. Resolve Brand
    if (data.brand && data.brand.length > 2) {
        if (mongoose.Types.ObjectId.isValid(data.brand)) {
            resolution.brandId = new mongoose.Types.ObjectId(data.brand);
        } else {
            const query: {
                name: RegExp;
                categoryIds?: mongoose.Types.ObjectId;
            } = { name: new RegExp(`^${escapeRegExp(data.brand)}$`, 'i') };
            if (resolution.categoryId) query.categoryIds = resolution.categoryId;

            const brand = await Brand.findOne(query).select('_id');
            if (brand) resolution.brandId = brand._id as mongoose.Types.ObjectId;
        }
    }

    // 3. Resolve Model
    if (data.model && data.model.length > 2) {
        if (mongoose.Types.ObjectId.isValid(data.model)) {
            resolution.modelId = new mongoose.Types.ObjectId(data.model);
        } else {
            const query: { name: string; brandId?: mongoose.Types.ObjectId } = { name: data.model };
            if (resolution.brandId) query.brandId = resolution.brandId;

            const model = await Model.findOne(query).select('_id');
            if (model) resolution.modelId = model._id as mongoose.Types.ObjectId;
        }
    }

    return resolution;
};
