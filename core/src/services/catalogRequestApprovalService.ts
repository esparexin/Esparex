import mongoose, { type ClientSession, type Types } from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { getUserConnection } from '../config/db';
import CatalogRequest, {
    type ICatalogRequest,
    CATALOG_REQUEST_STATUS_VALUES,
} from '../models/CatalogRequest';
import Brand from '../models/Brand';
import CatalogModel from '../models/Model';
import Category from '../models/Category';
import { AppError } from '../utils/AppError';
import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';
import { CATALOG_STATUS } from '@esparex/shared';
import CatalogOrchestrator from './catalog/CatalogOrchestrator';
import {
    ACTIVE_CATEGORY_QUERY,
    normalizeCatalogCanonicalName,
} from './catalog/CatalogValidationService';
import { scoreModeratorTrust } from './catalog/CatalogSearchGovernanceService';

const NON_DELETED_QUERY = {
    isDeleted: { $ne: true },
    deletedAt: null,
};

// ACTIVE_CATEGORY_QUERY imported from CatalogValidationService (SSOT)

const ACTIVE_BRAND_APPROVAL_QUERY = {
    ...NON_DELETED_QUERY,
    isActive: true,
    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
};

export type CatalogRequestStatusValue = (typeof CATALOG_REQUEST_STATUS_VALUES)[number];

export interface CatalogRequestApprovalResult {
    request: ICatalogRequest;
    resolvedEntityId: Types.ObjectId;
    createdCanonicalEntity: boolean;
}

export interface CatalogRequestRejectionResult {
    request: ICatalogRequest;
}

const assertValidObjectId = (value: string, fieldName: string): Types.ObjectId => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`Invalid ${fieldName}`, 400, 'INVALID_OBJECT_ID', {
            field: fieldName,
            value,
        });
    }
    return new mongoose.Types.ObjectId(value);
};

const buildCatalogSlug = (name: string, prefix: 'brand' | 'model'): string => {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    if (!baseSlug) {
        return `${prefix}-${nanoid(6)}`;
    }
    return `${baseSlug}-${nanoid(5)}`;
};

// normalizeCatalogCanonicalName imported from CatalogValidationService (SSOT)

const resolveRequestCanonicalName = (request: ICatalogRequest): string => (
    request.canonicalName
    || request.normalizedName
    || normalizeCatalogCanonicalName(request.requestedName)
);

const assertPendingRequest = (request: ICatalogRequest): void => {
    const isWaiting = ['pending', 'under_review', 'duplicate_review'].includes(request.status);
    if (!isWaiting) {
        throw new AppError('Only pending catalog requests can be reviewed.', 409, 'CATALOG_REQUEST_NOT_PENDING');
    }
};

const assertRequestCategoryIsActive = async (
    request: ICatalogRequest,
    session: ClientSession
): Promise<void> => {
    const activeCategory = await Category.findOne({
        _id: request.categoryId,
        ...ACTIVE_CATEGORY_QUERY,
    }).session(session);

    if (!activeCategory) {
        throw new AppError(
            'Catalog request category is inactive or no longer available.',
            409,
            'CATALOG_REQUEST_CATEGORY_INACTIVE'
        );
    }
};

const assertParentBrandIsActiveForModelRequest = async (
    request: ICatalogRequest,
    session: ClientSession
): Promise<void> => {
    if (request.requestType !== 'model') return;

    if (!request.parentBrandId) {
        throw new AppError('Model requests require a parentBrandId.', 400, 'CATALOG_REQUEST_PARENT_BRAND_REQUIRED');
    }

    const parentBrand = await Brand.findOne({
        _id: request.parentBrandId,
        ...ACTIVE_BRAND_APPROVAL_QUERY,
    }).session(session);

    if (!parentBrand) {
        throw new AppError(
            'Model request parent brand is inactive or no longer available.',
            409,
            'CATALOG_REQUEST_PARENT_BRAND_INACTIVE'
        );
    }
};

const coerceOptionalNotes = (value: string | null | undefined): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const hasObjectId = (items: unknown, target: Types.ObjectId): boolean => {
    if (!Array.isArray(items)) return false;
    const targetValue = String(target);
    return items.some((item) => String(item) === targetValue);
};

const setEntityField = (entity: Record<string, unknown>, field: string, value: unknown): void => {
    const maybeDocument = entity as Record<string, unknown> & { set?: (path: string, val: unknown) => void };
    if (typeof maybeDocument.set === 'function') {
        maybeDocument.set(field, value);
        return;
    }
    Reflect.set(entity, field, value);
};

const ensureCatalogActivationFlags = (entity: {
    approvalStatus?: string;
    isActive?: boolean;
    status?: string;
    rejectionReason?: string | null;
    needsReview?: boolean;
}): boolean => {
    let changed = false;
    if (entity.approvalStatus !== CATALOG_APPROVAL_STATUS.APPROVED) {
        setEntityField(entity as unknown as Record<string, unknown>, 'approvalStatus', CATALOG_APPROVAL_STATUS.APPROVED);
        changed = true;
    }
    if (entity.isActive !== true) {
        setEntityField(entity as unknown as Record<string, unknown>, 'isActive', true);
        changed = true;
    }
    if (entity.status !== CATALOG_STATUS.ACTIVE) {
        setEntityField(entity as unknown as Record<string, unknown>, 'status', CATALOG_STATUS.ACTIVE);
        changed = true;
    }
    if (entity.rejectionReason) {
        setEntityField(entity as unknown as Record<string, unknown>, 'rejectionReason', undefined);
        changed = true;
    }
    if (typeof entity.needsReview === 'boolean' && entity.needsReview) {
        setEntityField(entity as unknown as Record<string, unknown>, 'needsReview', false);
        changed = true;
    }
    return changed;
};

const buildApprovalTrustMetadata = (params: {
    requestCount?: number;
    createdCanonicalEntity?: boolean;
    duplicateResolution?: boolean;
}): Record<string, unknown> => {
    const requestCount = Math.max(1, Number(params.requestCount ?? 1));
    const moderatorTrustScore = scoreModeratorTrust({
        approvedActions: requestCount,
        duplicateApprovals: params.duplicateResolution ? requestCount : 0,
        aliasApprovals: params.createdCanonicalEntity ? 1 : 0,
    });
    const duplicateConfidenceScore = params.duplicateResolution
        ? 0.92
        : Math.max(0.18, 0.52 - Math.min(0.22, requestCount / 200));
    const canonicalCertaintyScore = params.duplicateResolution
        ? 0.88
        : Math.min(0.94, 0.72 + Math.min(0.16, requestCount / 100));

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
        crawlDepthLimit: 4,
        indexable: true,
        lastAuditAt: new Date(),
    };
};

const applyMarketplaceTrustMetadata = (
    entity: Record<string, unknown>,
    metadata: Record<string, unknown>
): void => {
    setEntityField(entity, 'marketplaceTrust', {
        ...(entity.marketplaceTrust && typeof entity.marketplaceTrust === 'object' ? entity.marketplaceTrust : {}),
        ...metadata,
    });
};

const ensureEntityActiveAndTrusted = async (
    entity: any,
    request: ICatalogRequest,
    session: ClientSession,
    trustParams: { createdCanonicalEntity?: boolean; duplicateResolution?: boolean }
): Promise<void> => {
    let needsSave = ensureCatalogActivationFlags(entity);

    if (!hasObjectId(entity.categoryIds, request.categoryId)) {
        entity.categoryIds = [...(entity.categoryIds ?? []), request.categoryId];
        needsSave = true;
    }
    
    applyMarketplaceTrustMetadata(entity, buildApprovalTrustMetadata({
        requestCount: request.requestCount,
        ...trustParams,
    }));
    needsSave = true;

    if (needsSave) {
        await entity.save({ session });
    }
};

const resolveOrCreateBrand = async (
    request: ICatalogRequest,
    session: ClientSession
): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    const requestCanonicalName = resolveRequestCanonicalName(request);

    let existingBrand = await Brand.findOne({
        canonicalName: requestCanonicalName,
        ...NON_DELETED_QUERY,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
    }).session(session);

    if (existingBrand) {
        await ensureEntityActiveAndTrusted(existingBrand, request, session, {
            createdCanonicalEntity: false,
        });
        return { entityId: existingBrand._id as Types.ObjectId, createdCanonicalEntity: false };
    }

    const canonicalName = requestCanonicalName;

    try {
        const created = await Brand.create(
            [
                {
                    name: request.requestedName,
                    displayName: request.requestedName,
                    canonicalName,
                    slug: buildCatalogSlug(request.requestedName, 'brand'),
                    categoryIds: [request.categoryId],
                    isActive: true,
                    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
                    status: CATALOG_STATUS.ACTIVE,
                    suggestedBy: request.requestedBy,
                    marketplaceTrust: buildApprovalTrustMetadata({
                        requestCount: request.requestCount,
                        createdCanonicalEntity: true,
                    }),
                },
            ],
            { session }
        );

        const createdBrand = created[0];
        return { entityId: createdBrand._id as Types.ObjectId, createdCanonicalEntity: true };
    } catch (error) {
        const mongoError = error as { code?: number };
        if (mongoError.code !== 11000) {
            throw error;
        }

        existingBrand = await Brand.findOne({
            canonicalName,
            ...NON_DELETED_QUERY,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
        }).session(session);

        if (!existingBrand) {
            throw error;
        }

        await ensureEntityActiveAndTrusted(existingBrand, request, session, {
            createdCanonicalEntity: false,
        });

        return { entityId: existingBrand._id as Types.ObjectId, createdCanonicalEntity: false };
    }
};

const resolveOrCreateModel = async (
    request: ICatalogRequest,
    session: ClientSession
): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    if (!request.parentBrandId) {
        throw new AppError('Model requests require a parentBrandId.', 400, 'CATALOG_REQUEST_PARENT_BRAND_REQUIRED');
    }

    const requestCanonicalName = resolveRequestCanonicalName(request);

    let existingModel = await CatalogModel.findOne({
        brandId: request.parentBrandId,
        canonicalName: requestCanonicalName,
        ...NON_DELETED_QUERY,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
    }).session(session);

    if (existingModel) {
        await ensureEntityActiveAndTrusted(existingModel, request, session, {
            createdCanonicalEntity: false,
        });
        return { entityId: existingModel._id as Types.ObjectId, createdCanonicalEntity: false };
    }

    const canonicalName = requestCanonicalName;

    try {
        const created = await CatalogModel.create(
            [
                {
                    name: request.requestedName,
                    displayName: request.requestedName,
                    canonicalName,
                    slug: buildCatalogSlug(request.requestedName, 'model'),
                    brandId: request.parentBrandId,
                    categoryIds: [request.categoryId],
                    isActive: true,
                    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
                    status: CATALOG_STATUS.ACTIVE,
                    suggestedBy: request.requestedBy,
                    marketplaceTrust: buildApprovalTrustMetadata({
                        requestCount: request.requestCount,
                        createdCanonicalEntity: true,
                    }),
                },
            ],
            { session }
        );

        const createdModel = created[0];
        return { entityId: createdModel._id as Types.ObjectId, createdCanonicalEntity: true };
    } catch (error) {
        const mongoError = error as { code?: number };
        if (mongoError.code !== 11000) {
            throw error;
        }

        existingModel = await CatalogModel.findOne({
            brandId: request.parentBrandId,
            canonicalName,
            ...NON_DELETED_QUERY,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
        }).session(session);

        if (!existingModel) {
            throw error;
        }

        await ensureEntityActiveAndTrusted(existingModel, request, session, {
            createdCanonicalEntity: false,
        });

        return { entityId: existingModel._id as Types.ObjectId, createdCanonicalEntity: false };
    }
};

const resolveDuplicateEntity = async (
    request: ICatalogRequest,
    duplicateOfEntityId: Types.ObjectId,
    session: ClientSession
): Promise<Types.ObjectId> => {
    if (request.requestType === 'brand') {
        const brand = await Brand.findOne({ _id: duplicateOfEntityId, ...NON_DELETED_QUERY }).session(session);
        if (!brand) {
            throw new AppError('Duplicate target brand was not found.', 404, 'DUPLICATE_ENTITY_NOT_FOUND');
        }

        await ensureEntityActiveAndTrusted(brand, request, session, {
            duplicateResolution: true,
        });

        return brand._id as Types.ObjectId;
    }

    const model = await CatalogModel.findOne({ _id: duplicateOfEntityId, ...NON_DELETED_QUERY }).session(session);
    if (!model) {
        throw new AppError('Duplicate target model was not found.', 404, 'DUPLICATE_ENTITY_NOT_FOUND');
    }

    if (request.parentBrandId && String(model.brandId) !== String(request.parentBrandId)) {
        throw new AppError('Duplicate model must belong to the requested parent brand.', 400, 'DUPLICATE_ENTITY_BRAND_MISMATCH');
    }

    await ensureEntityActiveAndTrusted(model, request, session, {
        duplicateResolution: true,
    });

    return model._id as Types.ObjectId;
};

const loadRequestForReview = async (
    requestId: Types.ObjectId,
    session: ClientSession
): Promise<ICatalogRequest> => {
    const request = await CatalogRequest.findById(requestId).session(session);
    if (!request) {
        throw new AppError('Catalog request not found.', 404, 'CATALOG_REQUEST_NOT_FOUND');
    }
    assertPendingRequest(request);
    return request;
};

export async function approveCatalogRequest(params: {
    requestId: string;
    adminId: string;
    adminNotes?: string | null;
}): Promise<CatalogRequestApprovalResult> {
    const requestId = assertValidObjectId(params.requestId, 'requestId');
    const adminId = assertValidObjectId(params.adminId, 'adminId');
    const adminNotes = coerceOptionalNotes(params.adminNotes);

    const connection = getUserConnection();
    const session = await connection.startSession();

    try {
        let response: CatalogRequestApprovalResult | null = null;

        await session.withTransaction(async () => {
            const request = await loadRequestForReview(requestId, session);
            await assertRequestCategoryIsActive(request, session);
            await assertParentBrandIsActiveForModelRequest(request, session);
            const resolution = request.requestType === 'brand'
                ? await resolveOrCreateBrand(request, session)
                : await resolveOrCreateModel(request, session);

            const now = new Date();
            request.status = 'approved';
            request.approvedEntityId = resolution.entityId;
            request.mergedIntoEntityId = null;
            request.rejectionReason = null;
            request.adminNotes = adminNotes;
            request.approvedBy = adminId;
            request.approvedAt = now;
            request.rejectedBy = null;
            request.rejectedAt = null;
            request.moderationIntelligence = {
                ...request.moderationIntelligence,
                moderatorTrustScore: scoreModeratorTrust({ approvedActions: request.requestCount }),
                moderationReliabilityScore: scoreModeratorTrust({ approvedActions: request.requestCount }),
                aliasApprovalConfidence: resolution.createdCanonicalEntity ? 0.56 : 0.66,
                synonymApprovalConfidence: resolution.createdCanonicalEntity ? 0.52 : 0.62,
                duplicateConfidenceScore: resolution.createdCanonicalEntity ? 0.3 : 0.58,
                canonicalCertaintyScore: resolution.createdCanonicalEntity ? 0.76 : 0.84,
                lastEvaluatedAt: now,
            };
            await request.save({ session });

            response = {
                request,
                resolvedEntityId: resolution.entityId,
                createdCanonicalEntity: resolution.createdCanonicalEntity,
            };
        });

        if (!response) {
            throw new AppError('Failed to approve catalog request.', 500, 'CATALOG_REQUEST_APPROVAL_FAILED');
        }

        const finalResponse = response as CatalogRequestApprovalResult;
        await CatalogOrchestrator.invalidateCatalogCache();

        return finalResponse;
    } finally {
        await session.endSession();
    }
}

export async function markCatalogRequestDuplicate(params: {
    requestId: string;
    adminId: string;
    duplicateOfEntityId: string;
    adminNotes?: string | null;
}): Promise<CatalogRequestApprovalResult> {
    const requestId = assertValidObjectId(params.requestId, 'requestId');
    const adminId = assertValidObjectId(params.adminId, 'adminId');
    const duplicateOfEntityId = assertValidObjectId(params.duplicateOfEntityId, 'duplicateOfEntityId');
    const adminNotes = coerceOptionalNotes(params.adminNotes);

    const connection = getUserConnection();
    const session = await connection.startSession();

    try {
        let response: CatalogRequestApprovalResult | null = null;

        await session.withTransaction(async () => {
            const request = await loadRequestForReview(requestId, session);
            const resolvedEntityId = await resolveDuplicateEntity(request, duplicateOfEntityId, session);

            const now = new Date();
            request.status = 'merged';
            request.approvedEntityId = null;
            request.mergedIntoEntityId = resolvedEntityId;
            request.rejectionReason = null;
            request.adminNotes = adminNotes;
            request.approvedBy = adminId;
            request.approvedAt = now;
            request.rejectedBy = null;
            request.rejectedAt = null;
            request.moderationIntelligence = {
                ...request.moderationIntelligence,
                moderatorTrustScore: scoreModeratorTrust({
                    approvedActions: request.requestCount,
                    duplicateApprovals: request.requestCount,
                }),
                moderationReliabilityScore: scoreModeratorTrust({
                    approvedActions: request.requestCount,
                    duplicateApprovals: request.requestCount,
                }),
                aliasApprovalConfidence: 0.68,
                synonymApprovalConfidence: 0.64,
                duplicateConfidenceScore: 0.92,
                canonicalCertaintyScore: 0.88,
                lastEvaluatedAt: now,
            };
            await request.save({ session });

            response = {
                request,
                resolvedEntityId,
                createdCanonicalEntity: false,
            };
        });

        if (!response) {
            throw new AppError('Failed to mark catalog request as merged.', 500, 'CATALOG_REQUEST_DUPLICATE_FAILED');
        }

        const finalResponse = response as CatalogRequestApprovalResult;
        await CatalogOrchestrator.invalidateCatalogCache();

        return finalResponse;
    } finally {
        await session.endSession();
    }
}

export async function rejectCatalogRequest(params: {
    requestId: string;
    adminId: string;
    rejectionReason: string;
    adminNotes?: string | null;
}): Promise<CatalogRequestRejectionResult> {
    const requestId = assertValidObjectId(params.requestId, 'requestId');
    const adminId = assertValidObjectId(params.adminId, 'adminId');
    const rejectionReason = params.rejectionReason.trim();
    const adminNotes = coerceOptionalNotes(params.adminNotes);

    if (!rejectionReason) {
        throw new AppError('rejectionReason is required.', 400, 'REJECTION_REASON_REQUIRED');
    }

    const connection = getUserConnection();
    const session = await connection.startSession();

    try {
        let response: CatalogRequestRejectionResult | null = null;

        await session.withTransaction(async () => {
            const request = await loadRequestForReview(requestId, session);

            request.status = 'rejected';
            request.approvedEntityId = null;
            request.mergedIntoEntityId = null;
            request.rejectionReason = rejectionReason;
            request.adminNotes = adminNotes;
            request.approvedBy = null;
            request.approvedAt = null;
            request.rejectedBy = adminId;
            request.rejectedAt = new Date();
            await request.save({ session });

            response = { request };
        });

        if (!response) {
            throw new AppError('Failed to reject catalog request.', 500, 'CATALOG_REQUEST_REJECTION_FAILED');
        }

        return response;
    } finally {
        await session.endSession();
    }
}
