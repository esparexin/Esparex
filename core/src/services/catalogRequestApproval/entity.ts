import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import { CATALOG_STATUS } from '@esparex/contracts';
import { scoreModeratorTrust } from '../catalog/CatalogSearchGovernanceService';

export const setEntityField = (entity: Record<string, unknown>, field: string, value: unknown): void => {
    const maybeDocument = entity as Record<string, unknown> & { set?: (path: string, val: unknown) => void };
    if (typeof maybeDocument.set === 'function') { maybeDocument.set(field, value); return; }
    Reflect.set(entity, field, value);
};

export const ensureCatalogActivationFlags = (entity: {
    approvalStatus?: string; isActive?: boolean; status?: string;
    rejectionReason?: string | null; needsReview?: boolean;
}): boolean => {
    let changed = false;
    if (entity.approvalStatus !== CATALOG_APPROVAL_STATUS.APPROVED) { setEntityField(entity as any, 'approvalStatus', CATALOG_APPROVAL_STATUS.APPROVED); changed = true; }
    if (entity.isActive !== true) { setEntityField(entity as any, 'isActive', true); changed = true; }
    if (entity.status !== CATALOG_STATUS.ACTIVE) { setEntityField(entity as any, 'status', CATALOG_STATUS.ACTIVE); changed = true; }
    if (entity.rejectionReason) { setEntityField(entity as any, 'rejectionReason', undefined); changed = true; }
    if (typeof entity.needsReview === 'boolean' && entity.needsReview) { setEntityField(entity as any, 'needsReview', false); changed = true; }
    return changed;
};

export const buildApprovalTrustMetadata = (params: { requestCount?: number; createdCanonicalEntity?: boolean; duplicateResolution?: boolean }): Record<string, unknown> => {
    const requestCount = Math.max(1, Number(params.requestCount ?? 1));
    const moderatorTrustScore = scoreModeratorTrust({
        approvedActions: requestCount,
        duplicateApprovals: params.duplicateResolution ? requestCount : 0,
        aliasApprovals: params.createdCanonicalEntity ? 1 : 0,
    });
    const duplicateConfidenceScore = params.duplicateResolution ? 0.92 : Math.max(0.18, 0.52 - Math.min(0.22, requestCount / 200));
    const canonicalCertaintyScore = params.duplicateResolution ? 0.88 : Math.min(0.94, 0.72 + Math.min(0.16, requestCount / 100));
    return {
        catalogTrustScore: Math.min(0.95, (moderatorTrustScore * 0.45) + (canonicalCertaintyScore * 0.45) + 0.08),
        variantTrustScore: 0.68,
        aliasTrustScore: params.createdCanonicalEntity ? 0.58 : 0.64,
        synonymTrustScore: params.createdCanonicalEntity ? 0.54 : 0.6,
        transliterationTrustScore: 0.64,
        moderatorTrustScore,
        moderationReliabilityScore: moderatorTrustScore,
        aliasApprovalConfidence: params.createdCanonicalEntity ? 0.56 : 0.66,
        synonymApprovalConfidence: params.createdCanonicalEntity ? 0.52 : 0.62,
        popularityConfidenceScore: 0.58,
        canonicalCertaintyScore,
        duplicateConfidenceScore,
        seoQualityScore: params.createdCanonicalEntity ? 0.58 : 0.64,
        crawlDepthLimit: 4, indexable: true, lastAuditAt: new Date(),
    };
};

export const applyMarketplaceTrustMetadata = (entity: Record<string, unknown>, metadata: Record<string, unknown>): void => {
    setEntityField(entity, 'marketplaceTrust', {
        ...(entity.marketplaceTrust && typeof entity.marketplaceTrust === 'object' ? entity.marketplaceTrust : {}),
        ...metadata,
    });
};

export const ensureEntityActiveAndTrusted = async (entity: any, request: { requestCount?: number; categoryId: unknown }, session: any, trustParams: { createdCanonicalEntity?: boolean; duplicateResolution?: boolean }): Promise<void> => {
    let needsSave = ensureCatalogActivationFlags(entity);
    if (!hasObjectId(entity.categoryIds, request.categoryId as any)) { entity.categoryIds = [...(entity.categoryIds ?? []), request.categoryId]; needsSave = true; }
    applyMarketplaceTrustMetadata(entity, buildApprovalTrustMetadata({ requestCount: request.requestCount, ...trustParams }));
    needsSave = true;
    if (needsSave) await entity.save({ session });
};

const hasObjectId = (items: unknown, target: any): boolean => {
    if (!Array.isArray(items)) return false;
    const targetValue = String(target);
    return items.some((item) => String(item) === targetValue);
};
