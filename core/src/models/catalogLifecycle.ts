import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import { deriveApprovalStatus } from '../services/catalog/CatalogValidationService';

// ─── marketplaceTrust Sub-Schema ──────────────────────────────────────────

/** Fields common to all catalog entities */
export const marketplaceTrustBaseDefinition: Record<string, object> = {
    catalogTrustScore: { type: Number, default: 0.72, min: 0, max: 1 },
    aliasTrustScore: { type: Number, default: 0.62, min: 0, max: 1 },
    synonymTrustScore: { type: Number, default: 0.58, min: 0, max: 1 },
    transliterationTrustScore: { type: Number, default: 0.64, min: 0, max: 1 },
    moderatorTrustScore: { type: Number, default: 0.7, min: 0, max: 1 },
    moderationReliabilityScore: { type: Number, default: 0.7, min: 0, max: 1 },
    aliasApprovalConfidence: { type: Number, default: 0.6, min: 0, max: 1 },
    synonymApprovalConfidence: { type: Number, default: 0.55, min: 0, max: 1 },
    popularityConfidenceScore: { type: Number, default: 0.65, min: 0, max: 1 },
    canonicalCertaintyScore: { type: Number, default: 0.72, min: 0, max: 1 },
    duplicateConfidenceScore: { type: Number, default: 0.5, min: 0, max: 1 },
    seoQualityScore: { type: Number, default: 0.6, min: 0, max: 1 },
    crawlDepthLimit: { type: Number, default: 4, min: 1, max: 8 },
    indexable: { type: Boolean, default: true },
    lastAuditAt: { type: Date },
} as const;

/** Full definition including variantTrustScore */
export const marketplaceTrustDefinition = {
    ...marketplaceTrustBaseDefinition,
    variantTrustScore: { type: Number, default: 0.66, min: 0, max: 1 },
};

export interface IMarketplaceTrustBase {
    catalogTrustScore?: number;
    aliasTrustScore?: number;
    synonymTrustScore?: number;
    transliterationTrustScore?: number;
    moderatorTrustScore?: number;
    moderationReliabilityScore?: number;
    aliasApprovalConfidence?: number;
    synonymApprovalConfidence?: number;
    popularityConfidenceScore?: number;
    canonicalCertaintyScore?: number;
    duplicateConfidenceScore?: number;
    seoQualityScore?: number;
    crawlDepthLimit?: number;
    indexable?: boolean;
    lastAuditAt?: Date;
}

export interface IMarketplaceTrust extends IMarketplaceTrustBase {
    variantTrustScore?: number;
}

// ─── Lifecycle Hooks ──────────────────────────────────────────────────────

/**
 * Derives and applies the catalog approval status to a document before validation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose pre-validate doc boundary; index signature not available
export const applyCatalogLifecycleFields = (mutableDoc: any, fallback = CATALOG_APPROVAL_STATUS.APPROVED) => {
    const approvalStatus = deriveApprovalStatus({
        approvalStatus: mutableDoc.approvalStatus,
        isActive: mutableDoc.isActive,
        fallback,
    });
    mutableDoc.approvalStatus = approvalStatus;
};

/**
 * Standard JSON transform for catalog entities (id mapping, cleanup).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose toJSON transform; _doc and ret types are not indexable
export const catalogEntityToJsonTransform = (_doc: any, ret: any) => {
    const json = ret;
    json.id = String(json._id);
    delete json._id;
    return json;
};
