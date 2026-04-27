"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMasterDataIds = void 0;
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const mongoose_1 = __importDefault(require("mongoose"));
const stringUtils_1 = require("./stringUtils");
const resolveMasterDataIds = async (data) => {
    const resolution = {};
    // 1. Resolve Category
    if (data.category && data.category.length > 2) {
        if (mongoose_1.default.Types.ObjectId.isValid(data.category)) {
            resolution.categoryId = new mongoose_1.default.Types.ObjectId(data.category);
        }
        else {
            const cat = await Category_1.default.findOne({
                $or: [{ slug: data.category }, { name: data.category }]
            }).select('_id');
            if (cat)
                resolution.categoryId = cat._id;
        }
    }
    // 2. Resolve Brand
    if (data.brand && data.brand.length > 2) {
        if (mongoose_1.default.Types.ObjectId.isValid(data.brand)) {
            resolution.brandId = new mongoose_1.default.Types.ObjectId(data.brand);
        }
        else {
            const query = { name: new RegExp(`^${(0, stringUtils_1.escapeRegExp)(data.brand)}$`, 'i') };
            if (resolution.categoryId)
                query.categoryIds = resolution.categoryId;
            const brand = await Brand_1.default.findOne(query).select('_id');
            if (brand)
                resolution.brandId = brand._id;
        }
    }
    // 3. Resolve Model
    if (data.model && data.model.length > 2) {
        if (mongoose_1.default.Types.ObjectId.isValid(data.model)) {
            resolution.modelId = new mongoose_1.default.Types.ObjectId(data.model);
        }
        else {
            const query = { name: data.model };
            if (resolution.brandId)
                query.brandId = resolution.brandId;
            const model = await Model_1.default.findOne(query).select('_id');
            if (model)
                resolution.modelId = model._id;
        }
    }
    return resolution;
};
exports.resolveMasterDataIds = resolveMasterDataIds;
//# sourceMappingURL=masterDataResolver.js.map