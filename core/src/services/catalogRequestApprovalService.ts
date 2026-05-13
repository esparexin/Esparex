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
import Ad from '../models/Ad';
import { AppError } from '../utils/AppError';
import { CATALOG_APPROVAL_STATUS } from '../constants/enums/catalogApprovalStatus';
import { CATALOG_STATUS } from '../constants/enums/catalogStatus';

const NON_DELETED_QUERY = {
    isDeleted: { $ne: true },
    deletedAt: null,
};

export type CatalogRequestStatusValue = (typeof CATALOG_REQUEST_STATUS_VALUES)[number];

export interface CatalogRequestApprovalResult {
    request: ICatalogRequest;
    resolvedEntityId: Types.ObjectId;
    createdCanonicalEntity: boolean;
    updatedAdsCount: number;
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

const normalizeCatalogCanonicalName = (value: string): string =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

const assertPendingRequest = (request: ICatalogRequest): void => {
    if (request.status !== 'pending') {
        throw new AppError('Only pending catalog requests can be reviewed.', 409, 'CATALOG_REQUEST_NOT_PENDING');
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

const resolveOrCreateBrand = async (
    request: ICatalogRequest,
    session: ClientSession
): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    let existingBrand = await Brand.findOne({
        canonicalName: request.normalizedName,
        ...NON_DELETED_QUERY,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
    }).session(session);

    if (existingBrand) {
        let needsSave = ensureCatalogActivationFlags(existingBrand as unknown as {
            approvalStatus?: string;
            isActive?: boolean;
            status?: string;
            rejectionReason?: string | null;
            needsReview?: boolean;
        });

        if (!hasObjectId(existingBrand.categoryIds, request.categoryId)) {
            existingBrand.categoryIds = [...(existingBrand.categoryIds ?? []), request.categoryId];
            needsSave = true;
        }
        if (!existingBrand.categoryId) {
            existingBrand.categoryId = request.categoryId;
            needsSave = true;
        }

        if (needsSave) {
            await existingBrand.save({ session });
        }
        return { entityId: existingBrand._id as Types.ObjectId, createdCanonicalEntity: false };
    }

    const normalizedName = normalizeCatalogCanonicalName(request.requestedName);
    const canonicalName = normalizedName || request.normalizedName;

    try {
        const created = await Brand.create(
            [
                {
                    name: request.requestedName,
                    displayName: request.requestedName,
                    canonicalName,
                    slug: buildCatalogSlug(request.requestedName, 'brand'),
                    categoryId: request.categoryId,
                    categoryIds: [request.categoryId],
                    isActive: true,
                    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
                    status: CATALOG_STATUS.ACTIVE,
                    suggestedBy: request.requestedBy,
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

        let needsSave = ensureCatalogActivationFlags(existingBrand as unknown as {
            approvalStatus?: string;
            isActive?: boolean;
            status?: string;
            rejectionReason?: string | null;
            needsReview?: boolean;
        });

        if (!hasObjectId(existingBrand.categoryIds, request.categoryId)) {
            existingBrand.categoryIds = [...(existingBrand.categoryIds ?? []), request.categoryId];
            needsSave = true;
        }
        if (!existingBrand.categoryId) {
            existingBrand.categoryId = request.categoryId;
            needsSave = true;
        }

        if (needsSave) {
            await existingBrand.save({ session });
        }

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

    let existingModel = await CatalogModel.findOne({
        brandId: request.parentBrandId,
        canonicalName: request.normalizedName,
        ...NON_DELETED_QUERY,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
    }).session(session);

    if (existingModel) {
        let needsSave = ensureCatalogActivationFlags(existingModel as unknown as {
            approvalStatus?: string;
            isActive?: boolean;
            status?: string;
            rejectionReason?: string | null;
        });

        if (!hasObjectId(existingModel.categoryIds, request.categoryId)) {
            existingModel.categoryIds = [...(existingModel.categoryIds ?? []), request.categoryId];
            needsSave = true;
        }
        if (!existingModel.categoryId) {
            existingModel.categoryId = request.categoryId;
            needsSave = true;
        }

        if (needsSave) {
            await existingModel.save({ session });
        }
        return { entityId: existingModel._id as Types.ObjectId, createdCanonicalEntity: false };
    }

    const normalizedName = normalizeCatalogCanonicalName(request.requestedName);
    const canonicalName = normalizedName || request.normalizedName;

    try {
        const created = await CatalogModel.create(
            [
                {
                    name: request.requestedName,
                    displayName: request.requestedName,
                    canonicalName,
                    slug: buildCatalogSlug(request.requestedName, 'model'),
                    brandId: request.parentBrandId,
                    categoryId: request.categoryId,
                    categoryIds: [request.categoryId],
                    isActive: true,
                    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
                    status: CATALOG_STATUS.ACTIVE,
                    suggestedBy: request.requestedBy,
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

        let needsSave = ensureCatalogActivationFlags(existingModel as unknown as {
            approvalStatus?: string;
            isActive?: boolean;
            status?: string;
            rejectionReason?: string | null;
        });

        if (!hasObjectId(existingModel.categoryIds, request.categoryId)) {
            existingModel.categoryIds = [...(existingModel.categoryIds ?? []), request.categoryId];
            needsSave = true;
        }
        if (!existingModel.categoryId) {
            existingModel.categoryId = request.categoryId;
            needsSave = true;
        }

        if (needsSave) {
            await existingModel.save({ session });
        }

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

        let needsSave = ensureCatalogActivationFlags(brand as unknown as {
            approvalStatus?: string;
            isActive?: boolean;
            status?: string;
            rejectionReason?: string | null;
            needsReview?: boolean;
        });

        if (!hasObjectId(brand.categoryIds, request.categoryId)) {
            brand.categoryIds = [...(brand.categoryIds ?? []), request.categoryId];
            needsSave = true;
        }
        if (!brand.categoryId) {
            brand.categoryId = request.categoryId;
            needsSave = true;
        }

        if (needsSave) {
            await brand.save({ session });
        }

        return brand._id as Types.ObjectId;
    }

    const model = await CatalogModel.findOne({ _id: duplicateOfEntityId, ...NON_DELETED_QUERY }).session(session);
    if (!model) {
        throw new AppError('Duplicate target model was not found.', 404, 'DUPLICATE_ENTITY_NOT_FOUND');
    }

    if (request.parentBrandId && String(model.brandId) !== String(request.parentBrandId)) {
        throw new AppError('Duplicate model must belong to the requested parent brand.', 400, 'DUPLICATE_ENTITY_BRAND_MISMATCH');
    }

    let needsSave = ensureCatalogActivationFlags(model as unknown as {
        approvalStatus?: string;
        isActive?: boolean;
        status?: string;
        rejectionReason?: string | null;
    });

    if (!hasObjectId(model.categoryIds, request.categoryId)) {
        model.categoryIds = [...(model.categoryIds ?? []), request.categoryId];
        needsSave = true;
    }
    if (!model.categoryId) {
        model.categoryId = request.categoryId;
        needsSave = true;
    }

    if (needsSave) {
        await model.save({ session });
    }

    return model._id as Types.ObjectId;
};

const resolveWaitingAds = async (
    request: ICatalogRequest,
    resolvedEntityId: Types.ObjectId,
    session: ClientSession
): Promise<number> => {
    const adPatch: Record<string, unknown> = {
        catalogPending: false,
    };

    if (request.requestType === 'brand') {
        adPatch.brandId = resolvedEntityId;
    } else {
        adPatch.modelId = resolvedEntityId;
        if (request.parentBrandId) {
            adPatch.brandId = request.parentBrandId;
        }
    }

    const result = await Ad.updateMany(
        {
            catalogRequestId: request._id,
            catalogPending: true,
            isDeleted: { $ne: true },
        },
        { $set: adPatch },
        { session }
    );

    return Number((result as { modifiedCount?: number }).modifiedCount ?? 0);
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
            const resolution = request.requestType === 'brand'
                ? await resolveOrCreateBrand(request, session)
                : await resolveOrCreateModel(request, session);

            const now = new Date();
            request.status = 'approved';
            request.approvedEntityId = resolution.entityId;
            request.duplicateOfEntityId = null;
            request.rejectionReason = null;
            request.adminNotes = adminNotes;
            request.approvedBy = adminId;
            request.approvedAt = now;
            request.rejectedBy = null;
            request.rejectedAt = null;
            await request.save({ session });

            const updatedAdsCount = await resolveWaitingAds(request, resolution.entityId, session);

            response = {
                request,
                resolvedEntityId: resolution.entityId,
                createdCanonicalEntity: resolution.createdCanonicalEntity,
                updatedAdsCount,
            };
        });

        if (!response) {
            throw new AppError('Failed to approve catalog request.', 500, 'CATALOG_REQUEST_APPROVAL_FAILED');
        }

        return response;
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
            request.status = 'duplicate';
            request.approvedEntityId = null;
            request.duplicateOfEntityId = resolvedEntityId;
            request.rejectionReason = null;
            request.adminNotes = adminNotes;
            request.approvedBy = adminId;
            request.approvedAt = now;
            request.rejectedBy = null;
            request.rejectedAt = null;
            await request.save({ session });

            const updatedAdsCount = await resolveWaitingAds(request, resolvedEntityId, session);

            response = {
                request,
                resolvedEntityId,
                createdCanonicalEntity: false,
                updatedAdsCount,
            };
        });

        if (!response) {
            throw new AppError('Failed to mark catalog request as duplicate.', 500, 'CATALOG_REQUEST_DUPLICATE_FAILED');
        }

        return response;
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
            request.duplicateOfEntityId = null;
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
