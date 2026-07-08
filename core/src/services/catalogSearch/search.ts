import type { Document, Model } from 'mongoose';
import logger from '../../utils/logger';
import { escapeRegExp } from '../../utils/stringUtils';
import type { AtlasCatalogSearchResult, SeoCrawlDecision } from './types';
import {
    normalizeCatalogSearchText,
    compact,
} from './transliteration';
import { telemetry } from './telemetry';
import { getTrustSignals } from './scoring';

const MAX_SEARCH_VARIANTS = 5;
const MAX_ATLAS_SHOULD_CLAUSES = 36;
const MIN_SEO_INDEX_QUALITY = 0.52;
const MAX_SEO_CRAWL_DEPTH = 4;

export function buildSearchVariants(search: string): string[] {
    const normalized = normalizeCatalogSearchText(search);
    const collapsed = compact(normalized);
    const variants: string[] = [];
    const pushVariant = (value: string) => {
        const normalizedValue = normalizeCatalogSearchText(value);
        if (normalizedValue.length < 2) return;
        if (!variants.includes(normalizedValue)) variants.push(normalizedValue);
    };

    pushVariant(search.trim());
    if (normalized) pushVariant(normalized);
    if (collapsed && collapsed !== normalized && collapsed.length >= 4) pushVariant(collapsed);

    if (normalized.length >= 4) {
        pushVariant(normalized.replace(/\biphne\b/g, 'iphone'));
        pushVariant(normalized.replace(/\bsamung\b/g, 'samsung'));
    }
    if (normalized.length >= 6) {
        pushVariant(normalized.replace(/dh/g, 'd'));
        pushVariant(normalized.replace(/dy/g, 'di'));
    }

    return variants.slice(0, MAX_SEARCH_VARIANTS);
}

export function buildRegexSearchClauses(search: string, searchFields: string[]): Record<string, unknown>[] {
    const variants = buildSearchVariants(search);
    const clauses: Record<string, unknown>[] = [];
    for (const variant of variants) {
        const safeSearch = escapeRegExp(variant);
        for (const field of searchFields) {
            clauses.push({ [field]: { $regex: safeSearch, $options: 'i' } });
        }
    }
    return clauses;
}

export async function tryAtlasCatalogSearch(params: {
    model: Model<Document>;
    query: Record<string, unknown>;
    search: string;
    searchFields: string[];
    skip: number;
    limit: number;
    indexName?: string;
}): Promise<AtlasCatalogSearchResult | null> {
    const variants = buildSearchVariants(params.search);
    if (variants.length === 0) return null;
    const queryCost = variants.length * params.searchFields.length;
    telemetry.queryCostUnits += queryCost;
    if (queryCost > MAX_ATLAS_SHOULD_CLAUSES) { telemetry.atlasFallbacks++; return null; }
    telemetry.atlasAttempts++;

    try {
        const should = variants.flatMap((query) => params.searchFields.map((path) => ({
            text: {
                query,
                path,
                fuzzy: { maxEdits: query.length > 7 ? 2 : 1, prefixLength: Math.min(3, Math.max(1, query.length - 2)) },
                score: { boost: { value: path === 'canonicalName' ? 12 : path === 'slug' ? 10 : path === 'displayName' || path === 'name' ? 7 : 3 } },
            },
        }))).slice(0, MAX_ATLAS_SHOULD_CLAUSES);

        const filterClauses: Record<string, any>[] = [];
        const mustNotClauses: Record<string, any>[] = [];
        const MAPPED_ATLAS_FIELDS = new Set(['isActive', 'isDeleted', 'approvalStatus', 'categoryIds', 'brandId', 'parentModelId', 'variantOfModelId', 'type']);

        for (const [key, rawVal] of Object.entries(params.query)) {
            let targetPath = key;
            if (key === 'categoryId') targetPath = 'categoryIds';
            if (key === 'variantModelId') targetPath = 'variantOfModelId';
            if (!MAPPED_ATLAS_FIELDS.has(targetPath)) continue;

            if (rawVal && typeof rawVal === 'object' && !Array.isArray(rawVal) && !(rawVal instanceof Date)) {
                const keys = Object.keys(rawVal);
                if (keys.length === 1) {
                    const op = keys[0];
                    const opVal = (rawVal as Record<string, any>)[op];
                    if (op === '$ne') {
                        mustNotClauses.push({ equals: { path: targetPath, value: typeof opVal === 'object' && opVal ? String(opVal) : opVal } });
                    } else if (op === '$in' && Array.isArray(opVal)) {
                        filterClauses.push({ in: { path: targetPath, value: opVal.map((v: any) => typeof v === 'object' && v ? String(v) : v) } });
                    } else if (op === '$nin' && Array.isArray(opVal)) {
                        mustNotClauses.push({ in: { path: targetPath, value: opVal.map((v: any) => typeof v === 'object' && v ? String(v) : v) } });
                    }
                }
            } else if (Array.isArray(rawVal)) {
                filterClauses.push({ in: { path: targetPath, value: rawVal.map((v: any) => typeof v === 'object' && v ? String(v) : v) } });
            } else {
                filterClauses.push({ equals: { path: targetPath, value: typeof rawVal === 'object' && rawVal ? String(rawVal) : rawVal } });
            }
        }

        const compound: Record<string, any> = { should, minimumShouldMatch: 1 };
        if (filterClauses.length > 0) compound.filter = filterClauses;
        if (mustNotClauses.length > 0) compound.mustNot = mustNotClauses;

        const atlasStartedAt = Date.now();
        const rows = await params.model.aggregate([
            { $search: { index: params.indexName || process.env.ATLAS_CATALOG_SEARCH_INDEX || 'catalog_search', compound } },
            { $match: params.query },
            { $skip: params.skip },
            { $limit: params.limit },
            { $project: { _id: 1, score: { $meta: 'searchScore' } } },
        ]).option({ maxTimeMS: Number(process.env.ATLAS_CATALOG_SEARCH_TIMEOUT_MS || 1200) });
        telemetry.atlasLatencyMs += Date.now() - atlasStartedAt;

        const scores = new Map<string, number>();
        const ids = rows.map((row) => { const id = String(row._id); scores.set(id, Number(row.score ?? 0)); return id; });
        return { ids, scores };
    } catch (error) {
        telemetry.atlasFallbacks++;
        logger.warn('[CatalogSearch] Atlas Search unavailable; using governed regex fallback', {
            modelName: params.model.modelName,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

export function buildSeoCanonicalPath(item: Record<string, unknown>): string | null {
    const segments = [item.categorySlug, item.brandSlug, item.parentSlug, item.slug]
        .map((segment) => normalizeCatalogSearchText(segment as string | undefined).replace(/\s+/g, '-'))
        .filter(Boolean);
    if (segments.length === 0) return null;
    return `/${segments.join('/')}`;
}

export function evaluateSeoCrawlDecision(item: Record<string, unknown>): SeoCrawlDecision {
    const canonicalPath = buildSeoCanonicalPath(item);
    const trust = getTrustSignals(item);
    const segments = canonicalPath ? canonicalPath.split('/').filter(Boolean) : [];
    const crawlDepth = segments.length;
    const reasons: string[] = [];
    const canonicalName = normalizeCatalogSearchText(item.canonicalName as string | undefined);
    const displayName = normalizeCatalogSearchText((item.displayName ?? item.name) as string | undefined);
    const descriptionLength = String(item.description ?? '').trim().length;
    const hasLineage = Boolean(item.categorySlug || item.brandSlug || item.parentSlug || item.modelId || item.brandId);
    const duplicateConfidence = trust.duplicateConfidenceScore ?? 0.5;
    let qualityScore = clamp01(trust.seoQualityScore, 0.6);

    if (!canonicalPath) { reasons.push('missing_canonical_path'); qualityScore -= 0.3; }
    if (crawlDepth > Math.min(MAX_SEO_CRAWL_DEPTH, trust.crawlDepthLimit ?? MAX_SEO_CRAWL_DEPTH)) { reasons.push('crawl_depth_exceeded'); telemetry.crawlBudgetSuppressions++; qualityScore -= 0.25; }
    if (!canonicalName || canonicalName === displayName && descriptionLength < 80) { reasons.push('thin_content'); telemetry.seoThinPageSuppressions++; qualityScore -= 0.2; }
    if (!hasLineage) { reasons.push('weak_lineage'); qualityScore -= 0.15; }
    if (duplicateConfidence > 0.72) { reasons.push('duplicate_seo_risk'); qualityScore -= 0.25; }
    if (trust.indexable === false) { reasons.push('explicit_noindex'); qualityScore = 0; }

    const finalQuality = clamp01(qualityScore, 0.6);
    telemetry.crawlQualityTotal += finalQuality;
    return {
        indexable: finalQuality >= MIN_SEO_INDEX_QUALITY && !reasons.includes('crawl_depth_exceeded') && !reasons.includes('explicit_noindex'),
        canonicalPath, qualityScore: finalQuality, crawlDepth, reasons,
    };
}

const clamp01 = (value: unknown, fallback = 0.5): number => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(1, Math.max(0, numeric));
};

export { MAX_SEARCH_VARIANTS, MAX_ATLAS_SHOULD_CLAUSES, MIN_SEO_INDEX_QUALITY, MAX_SEO_CRAWL_DEPTH };
