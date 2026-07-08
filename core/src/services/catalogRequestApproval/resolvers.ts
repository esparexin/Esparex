import { type ClientSession, type Types } from 'mongoose';
import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';
import { CATALOG_STATUS } from '@esparex/shared';
import Brand from '../../models/Brand';
import CatalogModel from '../../models/Model';
import type { ICatalogRequest } from '../../models/CatalogRequest';
import { AppError } from '../../utils/AppError';
import { buildCatalogSlug, resolveRequestCanonicalName, NON_DELETED_QUERY } from './validation';
import { buildApprovalTrustMetadata, ensureEntityActiveAndTrusted } from './entity';

export const resolveOrCreateBrand = async (request: ICatalogRequest, session: ClientSession): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    const requestCanonicalName = resolveRequestCanonicalName(request);
    let existingBrand = await Brand.findOne({
        canonicalName: requestCanonicalName, ...NON_DELETED_QUERY,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
    }).session(session);
    if (existingBrand) {
        await ensureEntityActiveAndTrusted(existingBrand, request, session, { createdCanonicalEntity: false });
        return { entityId: existingBrand._id as Types.ObjectId, createdCanonicalEntity: false };
    }
    try {
        const created = await Brand.create([{
            name: request.requestedName, displayName: request.requestedName, canonicalName: requestCanonicalName,
            slug: buildCatalogSlug(request.requestedName, 'brand'), categoryIds: [request.categoryId],
            isActive: true, approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED, status: CATALOG_STATUS.ACTIVE,
            suggestedBy: request.requestedBy,
            marketplaceTrust: buildApprovalTrustMetadata({ requestCount: request.requestCount, createdCanonicalEntity: true }),
        }], { session });
        return { entityId: created[0]._id as Types.ObjectId, createdCanonicalEntity: true };
    } catch (error: any) {
        if (error.code !== 11000) throw error;
        existingBrand = await Brand.findOne({ canonicalName: requestCanonicalName, ...NON_DELETED_QUERY, approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] } }).session(session);
        if (!existingBrand) throw error;
        await ensureEntityActiveAndTrusted(existingBrand, request, session, { createdCanonicalEntity: false });
        return { entityId: existingBrand._id as Types.ObjectId, createdCanonicalEntity: false };
    }
};

export const resolveOrCreateModel = async (request: ICatalogRequest, session: ClientSession): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    if (!request.parentBrandId) throw new AppError('Model requests require a parentBrandId.', 400, 'CATALOG_REQUEST_PARENT_BRAND_REQUIRED');
    const requestCanonicalName = resolveRequestCanonicalName(request);
    let existingModel = await CatalogModel.findOne({
        brandId: request.parentBrandId, canonicalName: requestCanonicalName, ...NON_DELETED_QUERY,
        approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
    }).session(session);
    if (existingModel) {
        await ensureEntityActiveAndTrusted(existingModel, request, session, { createdCanonicalEntity: false });
        return { entityId: existingModel._id as Types.ObjectId, createdCanonicalEntity: false };
    }
    try {
        const created = await CatalogModel.create([{
            name: request.requestedName, displayName: request.requestedName, canonicalName: requestCanonicalName,
            slug: buildCatalogSlug(request.requestedName, 'model'), brandId: request.parentBrandId,
            categoryIds: [request.categoryId], isActive: true, approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
            status: CATALOG_STATUS.ACTIVE, suggestedBy: request.requestedBy,
            marketplaceTrust: buildApprovalTrustMetadata({ requestCount: request.requestCount, createdCanonicalEntity: true }),
        }], { session });
        return { entityId: created[0]._id as Types.ObjectId, createdCanonicalEntity: true };
    } catch (error: any) {
        if (error.code !== 11000) throw error;
        existingModel = await CatalogModel.findOne({ brandId: request.parentBrandId, canonicalName: requestCanonicalName, ...NON_DELETED_QUERY, approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] } }).session(session);
        if (!existingModel) throw error;
        await ensureEntityActiveAndTrusted(existingModel, request, session, { createdCanonicalEntity: false });
        return { entityId: existingModel._id as Types.ObjectId, createdCanonicalEntity: false };
    }
};

export const resolveDuplicateEntity = async (request: ICatalogRequest, duplicateOfEntityId: Types.ObjectId, session: ClientSession): Promise<Types.ObjectId> => {
    if (request.requestType === 'brand') {
        const brand = await Brand.findOne({ _id: duplicateOfEntityId, ...NON_DELETED_QUERY }).session(session);
        if (!brand) throw new AppError('Duplicate target brand was not found.', 404, 'DUPLICATE_ENTITY_NOT_FOUND');
        await ensureEntityActiveAndTrusted(brand, request, session, { duplicateResolution: true });
        return brand._id as Types.ObjectId;
    }
    const model = await CatalogModel.findOne({ _id: duplicateOfEntityId, ...NON_DELETED_QUERY }).session(session);
    if (!model) throw new AppError('Duplicate target model was not found.', 404, 'DUPLICATE_ENTITY_NOT_FOUND');
    if (request.parentBrandId && String(model.brandId) !== String(request.parentBrandId)) throw new AppError('Duplicate model must belong to the requested parent brand.', 400, 'DUPLICATE_ENTITY_BRAND_MISMATCH');
    await ensureEntityActiveAndTrusted(model, request, session, { duplicateResolution: true });
    return model._id as Types.ObjectId;
};
