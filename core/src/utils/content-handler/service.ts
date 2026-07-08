import { Request, Response } from 'express';
import type { Document, Model } from 'mongoose';
import { LISTING_TYPE_VALUES, type ListingTypeValue } from '@esparex/shared';
import { getPaginationParams, sendPaginatedResponse, sendSuccessResponse, sendAdminError } from '../adminBaseController';
import { getCache, setCache, CACHE_TTLS } from '../redisCache';
import { FeatureFlag, isEnabled } from '../../config/featureFlags';
import { buildRegexSearchClauses, rankCatalogSearchResults, recordCatalogSearchTelemetry, shouldSuppressAutocomplete, tryAtlasCatalogSearch } from '../../services/catalog/CatalogSearchGovernanceService';
import { runCatalogShadowRead } from '../catalogShadowRead';
import type { ContentOptions } from './types';
import { CATALOG_MODELS, parseSortQuery, tryAdminCatalogReadSwitch } from './helpers';

const AF = new Set(['status','isActive','categoryId','categoryIds','brandId','modelId','parentModelId','variantOfModelId','variantModelId','type','needsReview','suggestedBy','createdBy','listingType']);
const IG = new Set(['page','limit','q','search','includeDeleted','sort','order','tab','view']);

export async function handlePaginatedContent<T extends Document>(req: Request, res: Response, model: Model<T>, options: ContentOptions = {}) {
    try {
        const user = (req as any).user;
        const isAdmin = Boolean((req as any).admin) || user?.role === 'admin' || user?.role === 'super_admin';
        const isUrlAdmin = req.originalUrl.includes('/admin');
        const { searchFields = ['name'], defaultSort = { name: 1 }, publicQuery = { isActive: true }, adminQuery = {}, populate, select, transformResponse, queryParams } = options;
        const eq = (queryParams || req.query) as Record<string, unknown>;
        const isCM = CATALOG_MODELS.includes(model.modelName);
        const uACR = isCM ? await isEnabled(FeatureFlag.USE_ADMIN_CATALOG_READS) : false;
        const uACS = isCM ? await isEnabled(FeatureFlag.ENABLE_ATLAS_CATALOG_SEARCH) : false;
        let ck: string | null = null;

        if (isCM) {
            const sq = Object.keys(eq).sort().map(k => `${k}=${encodeURIComponent(String(eq[k]))}`).join('&');
            ck = `catalog:list:${model.modelName.toLowerCase()}:${isUrlAdmin ? 'admin' : 'public'}:${uACR ? 'admin-read' : 'user-read'}:${req.path}?${sq}`;
            const cp = await getCache<any>(ck);
            if (cp) {
                const etag = `W/"${Buffer.from(JSON.stringify(cp)).toString('base64').substring(0, 24)}"`;
                res.setHeader('ETag', etag);
                if (req.headers['if-none-match'] === etag) return res.status(304).end();
                if (isUrlAdmin && Array.isArray(cp.items) && typeof cp.total === 'number' && typeof cp.page === 'number' && typeof cp.limit === 'number') return sendPaginatedResponse(res, cp.items, cp.total, cp.page, cp.limit);
                return sendSuccessResponse(res, cp);
            }
        }

        if (isAdmin && isUrlAdmin) {
            const { page, limit, skip } = getPaginationParams(req);
            const rs = eq.q || eq.search; const sv = Array.isArray(rs) ? rs[0] : rs;
            const st = Date.now(); const search = typeof sv === 'string' ? (sv as string).trim().slice(0, 120) : '';
            const incDel = eq.includeDeleted === 'true';
            if (search && limit <= 50 && shouldSuppressAutocomplete({ key: req.ip || 'admin', search, limit })) return sendPaginatedResponse(res, [], 0, page, limit);
            const q: Record<string, unknown> = { ...adminQuery };
            if (!incDel && !('isDeleted' in q)) q.isDeleted = { $ne: true };
            if (search && searchFields.length > 0) q.$or = buildRegexSearchClauses(search, searchFields);
            Object.entries(eq).forEach(([k, v]) => {
                if (IG.has(k) || !AF.has(k) || v === 'all' || v === '' || v === undefined) return;
                let tk = k;
                if (k === 'categoryId' && (model.schema as any)?.paths && 'categoryIds' in (model.schema as any).paths) tk = 'categoryIds';
                if (k === 'variantModelId' && (model.schema as any)?.paths && 'variantOfModelId' in (model.schema as any).paths) tk = 'variantOfModelId';
                if (q[tk] !== undefined) return;
                if (tk === 'status' && v === 'deleted' && q.isDeleted === true) return;
                let tv = v;
                if (tk === 'isActive') { if (v === 'true') tv = true; if (v === 'false') tv = false; }
                q[tk] = tv;
            });
            const asrt = Array.isArray(eq.sort) ? eq.sort[0] : eq.sort;
            const aSort = parseSortQuery(asrt, { createdAt: -1 });
            const ats = search && uACS ? await tryAtlasCatalogSearch({ model: model as any, query: q, search, searchFields, skip, limit }) : null;
            const efq = ats?.ids.length ? { ...q, _id: { $in: ats.ids } } : q;
            const fq = model.find(efq).skip(ats ? 0 : skip).limit(limit).sort(ats ? {} : aSort);
            if (incDel) fq.setOptions({ withDeleted: true });
            if (populate) (fq as any).populate(populate);
            if (select) fq.select(select);
            const cq = model.countDocuments(q);
            if (incDel) cq.setOptions({ withDeleted: true });
            const [items, total] = await Promise.all([fq, cq]);
            const ri = transformResponse ? await transformResponse(items as unknown[]) : items;
            const rk = search && Array.isArray(ri) ? rankCatalogSearchResults(ri, search, searchFields, ats?.scores, { autocomplete: limit <= 50, collapseVariants: limit <= 50 }) : ri;
            if (search) recordCatalogSearchTelemetry({ search, latencyMs: Date.now() - st, resultCount: Array.isArray(rk) ? rk.length : 0, autocomplete: limit <= 50 });
            if (uACR && Array.isArray(rk)) {
                const ar = await tryAdminCatalogReadSwitch({ req, model: model as any, query: q, sort: aSort, skip, limit, populate, select, includeDeleted: incDel, transformResponse, userItems: rk, userTotal: total });
                if (ar) { const p = { items: ar.items, total: ar.total, page, limit }; if (ck) await setCache(ck, p, CACHE_TTLS.CATEGORIES); return sendPaginatedResponse(res, ar.items, ar.total, page, limit); }
            }
            if (!uACR && Array.isArray(rk)) void runCatalogShadowRead({ modelName: model.modelName, query: q, sort: aSort, skip, limit, userRows: rk as Record<string, unknown>[], requestPath: req.originalUrl || req.path, requestMethod: req.method });
            if (!Array.isArray(rk)) { if (ck) await setCache(ck, rk, CACHE_TTLS.CATEGORIES); return sendSuccessResponse(res, rk); }
            const p = { items: rk, total, page, limit };
            if (ck) await setCache(ck, p, CACHE_TTLS.CATEGORIES);
            return sendPaginatedResponse(res, rk, total, page, limit);
        }

        // Public view
        const rp = eq.page; const rl = eq.limit;
        const rsv = eq.q || eq.search; const rs2 = Array.isArray(rsv) ? rsv[0] : rsv;
        const rso = Array.isArray(eq.sort) ? eq.sort[0] : eq.sort;
        const pp = parseInt(String(rp || '1')); const pl2 = parseInt(String(rl || '100'));
        const page = Number.isFinite(pp) && pp > 0 ? pp : 1;
        const limit = Math.min(Math.max(Number.isFinite(pl2) && pl2 > 0 ? pl2 : 100, 1), 100);
        const st2 = Date.now(); const search = typeof rs2 === 'string' ? rs2.trim().slice(0, 120) : '';
        const sort = parseSortQuery(rso, defaultSort);
        if (search && limit <= 50 && shouldSuppressAutocomplete({ key: req.ip || 'public', search, limit })) return sendSuccessResponse(res, { items: [], total: 0 });
        const q: Record<string, unknown> = { ...publicQuery };
        if (search && searchFields.length > 0) q.$or = buildRegexSearchClauses(search, searchFields);
        if (typeof eq.listingType === 'string' && LISTING_TYPE_VALUES.includes(eq.listingType as ListingTypeValue)) q.listingType = eq.listingType;
        const ats = search && uACS ? await tryAtlasCatalogSearch({ model: model as any, query: q, search, searchFields, skip: (page - 1) * limit, limit }) : null;
        const efq = ats?.ids.length ? { ...q, _id: { $in: ats.ids } } : q;
        const fq = model.find(efq).skip(ats ? 0 : (page - 1) * limit).limit(limit).sort(ats ? {} : sort);
        if (populate) (fq as any).populate(populate);
        if (select) fq.select(select);
        const [items, total] = await Promise.all([fq, model.countDocuments(q)]);
        const ri = transformResponse ? await transformResponse(items as unknown[]) : items;
        const rk = search && Array.isArray(ri) ? rankCatalogSearchResults(ri, search, searchFields, ats?.scores, { autocomplete: limit <= 50, collapseVariants: limit <= 50 }) : ri;
        if (search) recordCatalogSearchTelemetry({ search, latencyMs: Date.now() - st2, resultCount: Array.isArray(rk) ? rk.length : 0, autocomplete: limit <= 50 });
        if (uACR && Array.isArray(rk)) {
            const ar = await tryAdminCatalogReadSwitch({ req, model: model as any, query: q, sort, skip: (page - 1) * limit, limit, populate, select, transformResponse, userItems: rk, userTotal: total });
            if (ar) { const p = { items: ar.items, total: ar.total }; if (ck) await setCache(ck, p, CACHE_TTLS.CATEGORIES); return sendSuccessResponse(res, p); }
        }
        if (!uACR && Array.isArray(rk)) void runCatalogShadowRead({ modelName: model.modelName, query: q, sort, skip: (page - 1) * limit, limit, userRows: rk as Record<string, unknown>[], requestPath: req.originalUrl || req.path, requestMethod: req.method });
        if (!Array.isArray(rk)) { if (ck) await setCache(ck, rk, CACHE_TTLS.CATEGORIES); return sendSuccessResponse(res, rk); }
        const p = { items: rk, total };
        if (ck) await setCache(ck, p, CACHE_TTLS.CATEGORIES);
        return sendSuccessResponse(res, p);
    } catch (error) { sendAdminError(req, res, error); }
}
