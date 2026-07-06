import crypto from 'crypto';
import mongoose from 'mongoose';
import { FeatureFlag, isEnabled } from '../config/featureFlags';
import { getAdminConnection } from '../infrastructure/db';
import logger from './logger';

type GenericDoc = Record<string, unknown>;

const SHADOW_ENABLED_MODELS = new Set([
    'Category',
    'Brand',
    'Model',
    'ScreenSize',
    'ServiceType',
    'SparePart',
]);

const MODEL_TO_COLLECTION: Record<string, string> = {
    Category: 'categories',
    Brand: 'brands',
    Model: 'models',
    ScreenSize: 'screensizes',
    ServiceType: 'servicetypes',
    SparePart: 'spareparts',
};

const ID_FIELDS = new Set(['_id', 'id', 'categoryId', 'categoryIds', 'brandId', 'modelId']);

const castObjectId = (value: unknown): unknown => {
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return value;
};

export const castCatalogQueryIds = (value: unknown, fieldName?: string): unknown => {
    if (Array.isArray(value)) return value.map((entry) => castCatalogQueryIds(entry, fieldName));
    if (!value || typeof value !== 'object' || value instanceof Date || value instanceof mongoose.Types.ObjectId) {
        return ID_FIELDS.has(fieldName || '') ? castObjectId(value) : value;
    }

    const record = value as Record<string, unknown>;
    if ('$in' in record && ID_FIELDS.has(fieldName || '')) {
        return { ...record, $in: Array.isArray(record.$in) ? record.$in.map(castObjectId) : record.$in };
    }

    return Object.fromEntries(
        Object.entries(record).map(([key, entry]) => [key, castCatalogQueryIds(entry, key.startsWith('$') ? fieldName : key)])
    );
};

const safeString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
};

const toIdList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.map((entry) => safeString(entry)).filter(Boolean).sort();
    }
    const normalized = safeString(value);
    return normalized ? [normalized] : [];
};

const toSignatureItem = (doc: GenericDoc): GenericDoc => ({
    id: safeString(doc._id ?? doc.id),
    canonicalName: safeString(doc.canonicalName ?? doc.name ?? doc.displayName),
    slug: safeString(doc.slug),
    status: safeString(doc.status),
    approvalStatus: safeString(doc.approvalStatus),
    isActive: Boolean(doc.isActive),
    isDeleted: Boolean(doc.isDeleted),
    categoryIds: toIdList(doc.categoryIds ?? doc.categoryId),
    brandId: safeString(doc.brandId),
    modelId: safeString(doc.modelId),
});

const stableSerialize = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return `{${Object.keys(record).sort().map((k) => `${JSON.stringify(k)}:${stableSerialize(record[k])}`).join(',')}}`;
    }
    return JSON.stringify(value);
};

const hashPayload = (value: unknown): string =>
    crypto.createHash('sha256').update(stableSerialize(value)).digest('hex');

const toCatalogStatus = (value: unknown): string => {
    const normalized = safeString(value);
    if (!normalized) return '';
    if (normalized === 'approved') return 'live';
    if (normalized === 'pending') return 'inactive';
    if (normalized === 'rejected') return 'inactive';
    return normalized;
};

const harmonizeAdminVisibilityQuery = (query: Record<string, unknown>): Record<string, unknown> => {
    const next: Record<string, unknown> = { ...query };
    const approvalStatus = safeString(next.approvalStatus);
    if (!approvalStatus) return next;

    delete next.approvalStatus;
    const status = toCatalogStatus(approvalStatus);
    const fallbackClause: Record<string, unknown> = { approvalStatus: { $exists: false } };
    if (status) {
        fallbackClause.status = status;
    }

    next.$and = [
        ...((Array.isArray(next.$and) ? next.$and : []) as Record<string, unknown>[]),
        {
            $or: [
                { approvalStatus },
                fallbackClause,
            ],
        },
    ];
    return next;
};

export const summarizeCatalogReadDiff = (userRows: GenericDoc[], adminRows: GenericDoc[]) => {
    const byStableIdentity = (a: GenericDoc, b: GenericDoc): number => {
        const aKey = `${safeString(a.id)}|${safeString(a.canonicalName)}|${safeString(a.slug)}|${safeString(a.brandId)}|${safeString(a.modelId)}|${safeString(a.status)}`;
        const bKey = `${safeString(b.id)}|${safeString(b.canonicalName)}|${safeString(b.slug)}|${safeString(b.brandId)}|${safeString(b.modelId)}|${safeString(b.status)}`;
        return aKey.localeCompare(bKey);
    };
    const userSignatures = userRows.map(toSignatureItem).sort(byStableIdentity);
    const adminSignatures = adminRows.map(toSignatureItem).sort(byStableIdentity);
    const userHash = hashPayload(userSignatures);
    const adminHash = hashPayload(adminSignatures);
    const mismatch = userHash !== adminHash;
    return {
        mismatch,
        userHash,
        adminHash,
        userCount: userSignatures.length,
        adminCount: adminSignatures.length,
        summary: mismatch
            ? `hash-mismatch:user=${userSignatures.length}:admin=${adminSignatures.length}`
            : 'match',
    };
};

export const recordCatalogReadDiff = async (params: {
    modelName: string;
    query: Record<string, unknown>;
    userRows: GenericDoc[];
    adminRows: GenericDoc[];
    requestPath: string;
    requestMethod: string;
}): Promise<void> => {
    const diff = summarizeCatalogReadDiff(params.userRows, params.adminRows);
    if (!diff.mismatch) return;

    const adminConn = getAdminConnection();
    if (!adminConn.db) return;

    await adminConn.db.collection('catalog_shadow_read_diff_log').insertOne({
        requestPath: params.requestPath,
        requestMethod: params.requestMethod,
        modelName: params.modelName,
        query: params.query,
        userDbPayloadHash: diff.userHash,
        adminDbPayloadHash: diff.adminHash,
        mismatchSummary: diff.summary,
        userCount: diff.userCount,
        adminCount: diff.adminCount,
        createdAt: new Date(),
    });

    logger.warn('[CatalogShadowRead] Parity mismatch detected', {
        requestPath: params.requestPath,
        modelName: params.modelName,
        userCount: diff.userCount,
        adminCount: diff.adminCount,
    });
};

export const runCatalogShadowRead = async (params: {
    modelName: string;
    query: Record<string, unknown>;
    sort?: Record<string, 1 | -1>;
    skip?: number;
    limit?: number;
    userRows: GenericDoc[];
    requestPath: string;
    requestMethod: string;
}): Promise<void> => {
    if (!SHADOW_ENABLED_MODELS.has(params.modelName)) return;
    const enabled = await isEnabled(FeatureFlag.USE_ADMIN_CATALOG_READS);
    if (!enabled) return;

    const collectionName = MODEL_TO_COLLECTION[params.modelName];
    if (!collectionName) return;

    try {
        const adminConn = getAdminConnection();
        if (!adminConn.db) return;
        const adminQuery = harmonizeAdminVisibilityQuery(
            castCatalogQueryIds(params.query) as Record<string, unknown>
        );
        const cursor = adminConn.db.collection(collectionName).find(adminQuery);
        if (params.sort && Object.keys(params.sort).length > 0) cursor.sort(params.sort);
        if (typeof params.skip === 'number' && params.skip > 0) cursor.skip(params.skip);
        if (typeof params.limit === 'number' && params.limit > 0) cursor.limit(params.limit);
        const adminRows = await cursor.toArray();
        await recordCatalogReadDiff({
            requestPath: params.requestPath,
            requestMethod: params.requestMethod,
            modelName: params.modelName,
            query: params.query,
            userRows: params.userRows,
            adminRows: adminRows as GenericDoc[],
        });
    } catch (error) {
        logger.warn('[CatalogShadowRead] Failed', {
            modelName: params.modelName,
            requestPath: params.requestPath,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
