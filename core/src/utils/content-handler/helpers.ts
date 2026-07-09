import type { Document, Model } from 'mongoose';
import { Request } from 'express';
import logger from '../logger';
import { getAdminConnection, getUserConnection } from '../../config/db';
import { castCatalogQueryIds, summarizeCatalogReadDiff, recordCatalogReadDiff } from '../catalogShadowRead';

export const CATALOG_MODELS = ['Category', 'Brand', 'Model', 'ServiceType', 'ScreenSize', 'SparePart'];

export const ensureAdminCatalogModel = <T extends Document>(model: Model<T>): Model<T> => {
    const adminConn = getAdminConnection();
    const userConn = getUserConnection();
    for (const modelName of CATALOG_MODELS) {
        const userModel = userConn.models[modelName] as Model<Document> | undefined;
        if (userModel && !adminConn.models[modelName]) adminConn.model(modelName, userModel.schema, userModel.collection.name);
    }
    return (adminConn.models[model.modelName] as Model<T> | undefined) || adminConn.model<T>(model.modelName, model.schema, model.collection.name);
};

export const readAdminCatalogPage = async (params: {
    model: Model<Document>; query: Record<string, unknown>; sort: Record<string, 1 | -1>; skip: number; limit: number; populate?: unknown; select?: string; includeDeleted?: boolean;
}) => {
    const adminModel = ensureAdminCatalogModel(params.model);
    const adminQuery = castCatalogQueryIds(params.query) as Record<string, unknown>;
    const findQuery = adminModel.find(adminQuery).skip(params.skip).limit(params.limit).sort(params.sort);
    if (params.includeDeleted) findQuery.setOptions({ withDeleted: true });
    if (params.populate) (findQuery as any).populate(params.populate);
    if (params.select) findQuery.select(params.select);
    const countQuery = adminModel.countDocuments(adminQuery);
    if (params.includeDeleted) countQuery.setOptions({ withDeleted: true });
    return Promise.all([findQuery, countQuery]);
};

export const tryAdminCatalogReadSwitch = async <T extends Document>(params: {
    req: Request; model: Model<T>; query: Record<string, unknown>; sort: Record<string, 1 | -1>; skip: number; limit: number; populate?: unknown; select?: string; includeDeleted?: boolean; transformResponse?: (items: unknown[]) => unknown | Promise<unknown>; userItems: unknown[]; userTotal: number;
}): Promise<{ items: unknown[]; total: number } | null> => {
    try {
        const [adminItems, adminTotal] = await readAdminCatalogPage({ model: params.model as any, query: params.query, sort: params.sort, skip: params.skip, limit: params.limit, populate: params.populate, select: params.select, includeDeleted: params.includeDeleted });
        const rai = params.transformResponse ? await params.transformResponse(adminItems as unknown[]) : adminItems as unknown[];
        if (!Array.isArray(rai)) return null;
        const diff = summarizeCatalogReadDiff(params.userItems as Record<string, unknown>[], rai as Record<string, unknown>[]);
        if (!diff.mismatch && params.userTotal === adminTotal) return { items: rai, total: adminTotal };
        await recordCatalogReadDiff({ modelName: params.model.modelName, query: params.query, userRows: params.userItems as Record<string, unknown>[], adminRows: rai as Record<string, unknown>[], requestPath: params.req.originalUrl || params.req.path, requestMethod: params.req.method });
        logger.warn('[CatalogReadSwitch] Falling back', { requestPath: params.req.originalUrl || params.req.path, modelName: params.model.modelName, userTotal: params.userTotal, adminTotal, summary: diff.summary });
        return null;
    } catch (error) {
        logger.warn('[CatalogReadSwitch] Admin read failed', { requestPath: params.req.originalUrl || params.req.path, modelName: params.model.modelName, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
};

export const parseSortQuery = (rawSort: unknown, defaultSort: Record<string, 1 | -1>): Record<string, 1 | -1> => {
    if (typeof rawSort !== 'string' || rawSort.trim().length === 0) return defaultSort;
    const sort: Record<string, 1 | -1> = {};
    for (const segment of rawSort.split(',').map((s) => s.trim()).filter(Boolean)) {
        const dir: 1 | -1 = segment.startsWith('-') ? -1 : 1;
        const field = segment.replace(/^-/, '');
        if (!/^[a-zA-Z0-9_.]+$/.test(field)) continue;
        sort[field] = dir;
    }
    return Object.keys(sort).length > 0 ? sort : defaultSort;
};
