import mongoose from 'mongoose';
import { Request, Response } from 'express';
import logger from '../../../utils/logger';
import { toOptionalString } from './inputCoercion';
import { getCache, setCache } from '../../../utils/redisCache';
import { CatalogModel } from '../../../services/catalog/CatalogBrandModelService';
import { validateModelHierarchyMutation } from '../../../services/catalog/CatalogHierarchyService';
import { detectDuplicateCandidates } from '../../../services/catalog/CatalogSearchGovernanceService';
import VariantModel from '../../../models/Variant';

export const CATALOG_CACHE_TTL = 300;

export const normalizeCacheValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(normalizeCacheValue).join(',');
    if (value === undefined || value === null || value === '') return 'all';
    return encodeURIComponent(String(value));
};

export const catalogCacheKey = {
    brands: (categoryId: string) => `catalog:brands:${normalizeCacheValue(categoryId)}`,
    models: (params: {
        categoryId?: unknown; brandId?: unknown; parentModelId?: unknown; variantModelId?: unknown;
        includeVariants?: unknown; treeView?: unknown; search?: unknown; q?: unknown;
        page?: unknown; limit?: unknown; sort?: unknown;
    }) => ['catalog:models', `category=${normalizeCacheValue(params.categoryId)}`, `brand=${normalizeCacheValue(params.brandId)}`,
        `parent=${normalizeCacheValue(params.parentModelId)}`, `variant=${normalizeCacheValue(params.variantModelId)}`,
        `includeVariants=${normalizeCacheValue(params.includeVariants)}`, `treeView=${normalizeCacheValue(params.treeView)}`,
        `search=${normalizeCacheValue(params.search ?? params.q)}`, `page=${normalizeCacheValue(params.page ?? 1)}`,
        `limit=${normalizeCacheValue(params.limit ?? 100)}`, `sort=${normalizeCacheValue(params.sort ?? 'name')}`,
    ].join(':'),
};

export const normalizeOptionalObjectIdQuery = (value: unknown): string | undefined => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return undefined;
    const normalized = raw.trim();
    if (!normalized || normalized === 'all') return undefined;
    return mongoose.Types.ObjectId.isValid(normalized) ? normalized : undefined;
};

export const normalizeBooleanQuery = (value: unknown): boolean => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === true || raw === 'true' || raw === '1';
};

export const populateModelVariants = async (items: unknown[]) => {
    const modelIds = items.map((item) => { const m = item as { _id?: unknown; id?: unknown }; return m._id ?? m.id; }).filter(Boolean).map(String);
    if (modelIds.length === 0) return items;
    const [variantDocs, variantModelDocs] = await Promise.all([
        VariantModel.find({ modelId: { $in: modelIds }, isDeleted: { $ne: true } }).sort({ name: 1 }).lean(),
        CatalogModel.find({ variantOfModelId: { $in: modelIds }, isDeleted: { $ne: true } }).sort({ name: 1 }).lean(),
    ]);
    const variantsByModelId = new Map<string, unknown[]>();
    for (const v of variantDocs) { const mid = String((v as { modelId?: unknown }).modelId ?? ''); if (!mid) continue; const ex = variantsByModelId.get(mid) ?? []; ex.push(v); variantsByModelId.set(mid, ex); }
    const variantModelsByParentId = new Map<string, unknown[]>();
    for (const vm of variantModelDocs) { const pid = String((vm as { variantOfModelId?: unknown }).variantOfModelId ?? ''); if (!pid) continue; const ex = variantModelsByParentId.get(pid) ?? []; ex.push(vm); variantModelsByParentId.set(pid, ex); }
    return items.map((item) => {
        const plain = typeof (item as { toObject?: () => unknown }).toObject === 'function' ? (item as { toObject: () => Record<string, unknown> }).toObject() : { ...(item as Record<string, unknown>) };
        const id = String(plain._id ?? plain.id ?? '');
        return { ...plain, variants: variantsByModelId.get(id) ?? [], variantModels: variantModelsByParentId.get(id) ?? [] };
    });
};

export const applyModelHierarchyPayload = async (payload: Record<string, unknown>, options: { existingModel?: unknown } = {}) => {
    const normalizedPayload = {
        ...payload,
        brandId: toOptionalString(payload.brandId) ?? payload.brandId,
        parentModelId: payload.parentModelId === null ? null : toOptionalString(payload.parentModelId) ?? payload.parentModelId,
        variantOfModelId: payload.variantOfModelId === null ? null : toOptionalString(payload.variantOfModelId) ?? payload.variantOfModelId,
    };
    return validateModelHierarchyMutation(normalizedPayload, { existingModel: options.existingModel as any });
};

export const logModelDuplicateCandidates = async (req: Request, payload: Record<string, unknown>, options: { excludeId?: string } = {}) => {
    const name = String(payload.displayName ?? payload.name ?? payload.canonicalName ?? '').trim();
    const brandId = toOptionalString(payload.brandId);
    if (!name || !brandId) return;
    const candidates = await CatalogModel.find({ brandId, isDeleted: { $ne: true }, ...(options.excludeId ? { _id: { $ne: options.excludeId } } : {}) })
        .select('_id name displayName canonicalName slug aliases synonyms parentModelId variantOfModelId').limit(100).lean();
    const dupes = detectDuplicateCandidates(name, candidates as unknown as Record<string, unknown>[]);
    if (dupes.length > 0) logger.warn('[CatalogSearch] Potential model duplicate candidates detected', { requestPath: req.originalUrl || req.path, candidateCount: dupes.length, input: name, candidates: dupes });
};

export const applyCacheWriteThrough = (res: Response, cacheKey: string) => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) setCache(cacheKey, body, CATALOG_CACHE_TTL).catch(() => {});
        return originalJson(body);
    };
};
