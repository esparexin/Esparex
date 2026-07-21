import { getUserConnection } from '../../../../config/db';
import CatalogOrchestrator from '../services/CatalogOrchestrator';
import { scoreModeratorTrust } from '../services/CatalogSearchGovernanceService';
import { assertValidObjectId, coerceOptionalNotes, assertRequestCategoryIsActive, assertParentBrandIsActiveForModelRequest, loadRequestForReview } from './validation';
import { resolveOrCreateBrand, resolveOrCreateModel, resolveDuplicateEntity } from './resolvers';
import type { CatalogRequestApprovalResult, CatalogRequestRejectionResult } from './types';
import { AppError } from '../../../../utils/AppError';

export async function approveCatalogRequest(params: {
    requestId: string; adminId: string; adminNotes?: string | null;
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
            const resolution = request.requestType === 'brand' ? await resolveOrCreateBrand(request, session) : await resolveOrCreateModel(request, session);
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
            response = { request, resolvedEntityId: resolution.entityId, createdCanonicalEntity: resolution.createdCanonicalEntity };
        });
        if (!response) throw new AppError('Failed to approve catalog request.', 500, 'CATALOG_REQUEST_APPROVAL_FAILED');
        await CatalogOrchestrator.invalidateCatalogCache();
        return response;
    } finally { await session.endSession(); }
}

export async function markCatalogRequestDuplicate(params: {
    requestId: string; adminId: string; duplicateOfEntityId: string; adminNotes?: string | null;
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
                moderatorTrustScore: scoreModeratorTrust({ approvedActions: request.requestCount, duplicateApprovals: request.requestCount }),
                moderationReliabilityScore: scoreModeratorTrust({ approvedActions: request.requestCount, duplicateApprovals: request.requestCount }),
                aliasApprovalConfidence: 0.68, synonymApprovalConfidence: 0.64,
                duplicateConfidenceScore: 0.92, canonicalCertaintyScore: 0.88, lastEvaluatedAt: now,
            };
            await request.save({ session });
            response = { request, resolvedEntityId, createdCanonicalEntity: false };
        });
        if (!response) throw new AppError('Failed to mark catalog request as merged.', 500, 'CATALOG_REQUEST_DUPLICATE_FAILED');
        await CatalogOrchestrator.invalidateCatalogCache();
        return response;
    } finally { await session.endSession(); }
}

export async function rejectCatalogRequest(params: {
    requestId: string; adminId: string; rejectionReason: string; adminNotes?: string | null;
}): Promise<CatalogRequestRejectionResult> {
    const requestId = assertValidObjectId(params.requestId, 'requestId');
    const adminId = assertValidObjectId(params.adminId, 'adminId');
    const rejectionReason = params.rejectionReason.trim();
    const adminNotes = coerceOptionalNotes(params.adminNotes);
    if (!rejectionReason) throw new AppError('rejectionReason is required.', 400, 'REJECTION_REASON_REQUIRED');
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
        if (!response) throw new AppError('Failed to reject catalog request.', 500, 'CATALOG_REQUEST_REJECTION_FAILED');
        return response;
    } finally { await session.endSession(); }
}
