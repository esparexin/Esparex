import mongoose from 'mongoose';
import { CACHE_KEYS, getMultiCache, setMultiCache } from '../../domains/listings/application/ad/ad/_shared/adServiceBase';

type MetadataRef = mongoose.Types.ObjectId | string;
type MetadataEntity = Record<string, unknown> & {
    _id: MetadataRef;
    id?: MetadataRef;
    name?: string;
    slug?: string;
};
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import ServiceType from '../../models/ServiceType';
import Ad from '../../models/Ad';
import type { HydratedAd } from './types';

async function fetchMetadataWithCache<T>(
    ids: Set<string>,
    type: string,
    query: (missingIds: string[]) => Promise<T[]>,
    idField: string = '_id'
): Promise<T[]> {
    if (ids.size === 0) return [];
    const idArray = Array.from(ids);
    const cacheKeys = idArray.map(id => CACHE_KEYS.metadata(type, id));
    const cachedResults = await getMultiCache<T>(cacheKeys);
    const results: T[] = [];
    const missingIds: string[] = [];
    cachedResults.forEach((val: any, index: any) => {
        if (val) results.push(val);
        else { const id = idArray[index]; if (id) missingIds.push(id); }
    });
    if (missingIds.length > 0) {
        const fresh = await query(missingIds);
        results.push(...fresh);
        const cacheEntries = fresh.map(item => ({ key: CACHE_KEYS.metadata(type, String((item as MetadataEntity)[idField])), value: item }));
        if (cacheEntries.length > 0) await setMultiCache(cacheEntries);
    }
    return results;
}

export async function hydrateAdMetadata(ads: HydratedAd[]): Promise<HydratedAd[]> {
    if (!ads || ads.length === 0) return ads;
    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    const modelIds = new Set<string>();
    const sparePartIds = new Set<string>();
    const serviceTypeIds = new Set<string>();
    const extractId = (val: unknown): string | null => {
        if (!val) return null;
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            const record = val as Record<string, unknown>;
            const objectId = record._id;
            if (typeof objectId === 'string' || objectId instanceof mongoose.Types.ObjectId) return objectId.toString();
            const id = record.id;
            if (typeof id === 'string' || id instanceof mongoose.Types.ObjectId) return id.toString();
        }
        if (val instanceof mongoose.Types.ObjectId) return val.toString();
        return null;
    };
    ads.forEach(ad => {
        const catId = extractId(ad.categoryId || ad.category); if (catId) categoryIds.add(catId);
        const bId = extractId(ad.brandId || ad.brand); if (bId) brandIds.add(bId);
        const mId = extractId(ad.modelId || ad.model); if (mId) modelIds.add(mId);
        const spId = extractId(ad.sparePartId || ad.sparePart); if (spId) sparePartIds.add(spId);
        if (Array.isArray(ad.sparePartIds)) ad.sparePartIds.forEach((id) => { const sid = extractId(id); if (sid) sparePartIds.add(sid); });
        if (Array.isArray(ad.serviceTypeIds)) ad.serviceTypeIds.forEach((id) => { const sid = extractId(id); if (sid) serviceTypeIds.add(sid); });
    });
    const [categories, brands, models, spareParts, serviceTypes] = await Promise.all([
        fetchMetadataWithCache<MetadataEntity>(categoryIds, 'category', (missing) => Category.find({ _id: { $in: missing } }).select('name slug').lean<MetadataEntity[]>()),
        fetchMetadataWithCache<MetadataEntity>(brandIds, 'brand', (missing) => Brand.find({ _id: { $in: missing } }).select('name slug').lean<MetadataEntity[]>()),
        fetchMetadataWithCache<MetadataEntity>(modelIds, 'model', (missing) => Model.find({ _id: { $in: missing } }).select('name slug').lean<MetadataEntity[]>()),
        fetchMetadataWithCache<MetadataEntity>(sparePartIds, 'sparepart', (missing) => SparePart.find({ _id: { $in: missing } }).lean<MetadataEntity[]>()),
        fetchMetadataWithCache<MetadataEntity>(serviceTypeIds, 'servicetype', (missing) => ServiceType.find({ _id: { $in: missing } }).select('name').lean<MetadataEntity[]>()),
    ]);
    const categoryMap = new Map(categories.map((c) => [String(c._id), c]));
    const brandMap = new Map(brands.map((b) => [String(b._id), b]));
    const modelMap = new Map(models.map((m) => [String(m._id), m]));
    const sparePartMap = new Map(spareParts.map((s) => [String(s._id), s]));
    const serviceTypeMap = new Map(serviceTypes.map((st) => [String(st._id), st]));
    ads.forEach(ad => {
        const catId = extractId(ad.categoryId || ad.category); if (catId) { ad.categoryId = catId; const cat = categoryMap.get(catId); if (cat?.name) ad.categoryName = cat.name; } delete ad.category;
        const bId = extractId(ad.brandId || ad.brand); if (bId) { ad.brandId = bId; const brand = brandMap.get(bId); if (brand?.name) ad.brandName = brand.name; }
        if (typeof ad.brand === 'object' && ad.brand !== null && !ad.brandName) { const b = ad.brand as any; if (b.name) ad.brandName = b.name; }
        const mId = extractId(ad.modelId || ad.model); if (mId) { ad.modelId = mId; const model = modelMap.get(mId); if (model?.name) ad.modelName = model.name; }
        if (typeof ad.model === 'object' && ad.model !== null && !ad.modelName) { const m = ad.model as any; if (m.name) ad.modelName = m.name; }
        const spId = extractId(ad.sparePartId || ad.sparePart); if (spId) ad.sparePart = sparePartMap.get(spId);
        if (Array.isArray(ad.sparePartIds)) ad.spareParts = ad.sparePartIds.map((id) => { const sid = extractId(id); return sid ? sparePartMap.get(sid) : null; }).filter(Boolean) as MetadataEntity[];
        if (Array.isArray(ad.serviceTypeIds)) ad.serviceTypes = ad.serviceTypeIds.map((id) => { const sid = extractId(id); return sid ? serviceTypeMap.get(sid) : null; }).filter(Boolean) as MetadataEntity[];
    });
    return ads;
}

export const getOwnerListings = async (query: Record<string, unknown>, page: number, limit: number) => {
    const populateSpecs = [
        { path: 'categoryId', model: Category, select: 'name slug icon' },
        { path: 'brandId', model: Brand, select: 'name slug' },
        { path: 'modelId', model: Model, select: 'name slug' },
        { path: 'sparePartId', model: SparePart, select: 'name slug' },
        { path: 'serviceTypeIds', model: ServiceType, select: 'name slug' },
    ] as const;
    const itemsQuery = populateSpecs.reduce((builder, spec) => builder.populate(spec), Ad.find(query));
    const [items, total] = await Promise.all([
        itemsQuery.sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Ad.countDocuments(query),
    ]);
    return { items, total };
};
