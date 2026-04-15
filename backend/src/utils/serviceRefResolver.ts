import { serializeDocs } from './serialize';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Model from '../models/Model';

export interface ServiceRecord extends Record<string, unknown> {
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
}

interface LookupDoc {
    id?: unknown;
    _id?: unknown;
    name?: unknown;
    icon?: unknown;
}

const asString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.length > 0) return value;
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
const normalizeId = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        const idLike = value as { _id?: unknown; id?: unknown };
        if (idLike._id) return String(idLike._id);
        if (idLike.id) return String(idLike.id);
    }
    return String(value);
};

const toLookup = <T extends LookupDoc>(docs: T[], extra?: (doc: T) => Record<string, unknown>) => {
    const map = new Map<string, Record<string, unknown>>();
    docs.forEach((doc) => {
        const id = asString(doc.id || doc._id);
        if (!id) return;
        map.set(id, {
            id,
            ...(asString(doc.name) ? { name: asString(doc.name) } : {}),
            ...(asString(doc.icon) ? { icon: asString(doc.icon) } : {}),
            ...(extra ? extra(doc) : {})
        });
    });
    return map;
};

export const hydrateServiceRefs = async (services: ServiceRecord[]) => {
    if (!services || services.length === 0) return services;

    const normalized = serializeDocs(services);

    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    const modelIds = new Set<string>();

    normalized.forEach((service) => {
        const categoryId = normalizeId(service.categoryId);
        const brandId = normalizeId(service.brandId);
        const modelId = normalizeId(service.modelId);

        if (categoryId) categoryIds.add(categoryId);
        if (brandId) brandIds.add(brandId);
        if (modelId) modelIds.add(modelId);
    });

    const [categories, brands, models] = await Promise.all([
        categoryIds.size > 0
            ? Category.find({ _id: { $in: Array.from(categoryIds) } }).select('name icon').lean<LookupDoc[]>()
            : Promise.resolve([] as LookupDoc[]),
        brandIds.size > 0
            ? Brand.find({ _id: { $in: Array.from(brandIds) } }).select('name').lean<LookupDoc[]>()
            : Promise.resolve([] as LookupDoc[]),
        modelIds.size > 0
            ? Model.find({ _id: { $in: Array.from(modelIds) } }).select('name').lean<LookupDoc[]>()
            : Promise.resolve([] as LookupDoc[]),
    ]);

    // Serialize lookup data to ensure 'id' field exists
    const serializedCategories = serializeDocs(categories);
    const serializedBrands = serializeDocs(brands);
    const serializedModels = serializeDocs(models);

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
