"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrateServiceRefs = void 0;
const serialize_1 = require("./serialize");
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const asString = (value) => {
    if (typeof value === 'string' && value.length > 0)
        return value;
    if (value !== null && value !== undefined) {
        const converted = String(value);
        return converted.length > 0 ? converted : undefined;
    }
    return undefined;
};
/**
 * Normalizes any value to a string ID.
 * Avoids coordinate leakage by only returning ID strings.
 */
const normalizeId = (value) => {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value;
    if (typeof value === 'object' && value !== null) {
        const idLike = value;
        if (idLike._id)
            return String(idLike._id);
        if (idLike.id)
            return String(idLike.id);
    }
    return String(value);
};
const toLookup = (docs, extra) => {
    const map = new Map();
    docs.forEach((doc) => {
        const id = asString(doc.id || doc._id);
        if (!id)
            return;
        map.set(id, {
            id,
            ...(asString(doc.name) ? { name: asString(doc.name) } : {}),
            ...(asString(doc.icon) ? { icon: asString(doc.icon) } : {}),
            ...(extra ? extra(doc) : {})
        });
    });
    return map;
};
const hydrateServiceRefs = async (services) => {
    if (!services || services.length === 0)
        return services;
    const normalized = (0, serialize_1.serializeDocs)(services);
    const categoryIds = new Set();
    const brandIds = new Set();
    const modelIds = new Set();
    normalized.forEach((service) => {
        const categoryId = normalizeId(service.categoryId);
        const brandId = normalizeId(service.brandId);
        const modelId = normalizeId(service.modelId);
        if (categoryId)
            categoryIds.add(categoryId);
        if (brandId)
            brandIds.add(brandId);
        if (modelId)
            modelIds.add(modelId);
    });
    const [categories, brands, models] = await Promise.all([
        categoryIds.size > 0
            ? Category_1.default.find({ _id: { $in: Array.from(categoryIds) } }).select('name icon').lean()
            : Promise.resolve([]),
        brandIds.size > 0
            ? Brand_1.default.find({ _id: { $in: Array.from(brandIds) } }).select('name').lean()
            : Promise.resolve([]),
        modelIds.size > 0
            ? Model_1.default.find({ _id: { $in: Array.from(modelIds) } }).select('name').lean()
            : Promise.resolve([]),
    ]);
    // Serialize lookup data to ensure 'id' field exists
    const serializedCategories = (0, serialize_1.serializeDocs)(categories);
    const serializedBrands = (0, serialize_1.serializeDocs)(brands);
    const serializedModels = (0, serialize_1.serializeDocs)(models);
    const categoryLookup = toLookup(serializedCategories);
    const brandLookup = toLookup(serializedBrands);
    const modelLookup = toLookup(serializedModels);
    return normalized.map((service) => {
        const categoryId = normalizeId(service.categoryId);
        const brandId = normalizeId(service.brandId);
        const modelId = normalizeId(service.modelId);
        if (categoryId && categoryLookup.has(categoryId)) {
            service.categoryId = categoryLookup.get(categoryId);
        }
        if (brandId && brandLookup.has(brandId)) {
            service.brandId = brandLookup.get(brandId);
        }
        if (modelId && modelLookup.has(modelId)) {
            service.modelId = modelLookup.get(modelId);
        }
        // Map populated sellerId to seller for frontend consistency
        if (service.sellerId && typeof service.sellerId === 'object') {
            service.seller = service.sellerId;
            service.sellerId = normalizeId(service.sellerId);
        }
        return service;
    });
};
exports.hydrateServiceRefs = hydrateServiceRefs;
//# sourceMappingURL=serviceRefResolver.js.map