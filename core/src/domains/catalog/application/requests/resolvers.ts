import { type ClientSession, type Types } from 'mongoose';
import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import { CATALOG_STATUS } from '@esparex/contracts';
import Brand, { type IBrand } from '../../../../models/Brand';
import CatalogModel, { type IModel } from '../../../../models/Model';
import type { ICatalogRequest } from '../../../../models/CatalogRequest';
import { AppError } from '../../../../shared-kernel/errors/AppError';
import { buildCatalogSlug, resolveRequestCanonicalName, NON_DELETED_QUERY } from './validation';
import { buildApprovalTrustMetadata, ensureEntityActiveAndTrusted, type CatalogActivationEntity } from './entity';

interface ResolveOrCreateOptions<TDoc, TEntity extends CatalogActivationEntity & { _id: Types.ObjectId }> {
    entityType: 'brand' | 'model';
    findExisting: (canonicalName: string, session: ClientSession) => Promise<TEntity | null>;
    findExistingAfterError: (canonicalName: string, session: ClientSession) => Promise<TEntity | null>;
    createEntity: (data: TDoc, session: ClientSession) => Promise<{ _id: Types.ObjectId }[]>;
    buildCreateData: (request: ICatalogRequest, canonicalName: string) => TDoc;
}

// Brand creation only needs a subset of IBrand fields (others have schema defaults)
interface BrandCreateInput extends Partial<IBrand> {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    categoryIds: Types.ObjectId[];
}

// Model creation only needs a subset of IModel fields
interface ModelCreateInput extends Partial<IModel> {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    brandId: Types.ObjectId;
    categoryIds: Types.ObjectId[];
}

/**
 * Generic resolve-or-create pattern for catalog entities (brand/model).
 * Handles: find existing -> create -> on duplicate key error find existing again.
 */
const resolveOrCreateEntity = async <TDoc, TEntity extends CatalogActivationEntity & { _id: Types.ObjectId }>(
    request: ICatalogRequest,
    session: ClientSession,
    options: ResolveOrCreateOptions<TDoc, TEntity>
): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    const requestCanonicalName = resolveRequestCanonicalName(request);
    
    // Try to find existing
    const existing = await options.findExisting(requestCanonicalName, session);
    if (existing) {
        await ensureEntityActiveAndTrusted(existing, request, session, { createdCanonicalEntity: false });
        return { entityId: existing._id, createdCanonicalEntity: false };
    }
    
    // Try to create
    try {
        const createData = options.buildCreateData(request, requestCanonicalName);
        const created = await options.createEntity(createData, session);
        return { entityId: created[0]._id as Types.ObjectId, createdCanonicalEntity: true };
    } catch (error: unknown) {
        // On duplicate key error, find existing and return it
        if ((error as { code?: number }).code !== 11000) throw error;
        const existingAfterError = await options.findExistingAfterError(requestCanonicalName, session);
        if (!existingAfterError) throw error;
        await ensureEntityActiveAndTrusted(existingAfterError, request, session, { createdCanonicalEntity: false });
        return { entityId: existingAfterError._id, createdCanonicalEntity: false };
    }
};

export const resolveOrCreateBrand = async (request: ICatalogRequest, session: ClientSession): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    return resolveOrCreateEntity<BrandCreateInput, IBrand>(request, session, {
        entityType: 'brand',
        findExisting: (canonicalName, session) => Brand.findOne({
            canonicalName, ...NON_DELETED_QUERY,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
        }).session(session),
        findExistingAfterError: (canonicalName, session) => Brand.findOne({
            canonicalName, ...NON_DELETED_QUERY,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
        }).session(session),
        createEntity: (data: BrandCreateInput, session: ClientSession) => Brand.create([data], { session }),
        buildCreateData: (req, canonicalName) => ({
            name: req.requestedName, displayName: req.requestedName, canonicalName,
            slug: buildCatalogSlug(req.requestedName, 'brand'), categoryIds: [req.categoryId],
            isActive: true, approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED, status: CATALOG_STATUS.ACTIVE,
            suggestedBy: req.requestedBy,
            marketplaceTrust: buildApprovalTrustMetadata({ requestCount: req.requestCount, createdCanonicalEntity: true }),
        }),
    });
};

export const resolveOrCreateModel = async (request: ICatalogRequest, session: ClientSession): Promise<{ entityId: Types.ObjectId; createdCanonicalEntity: boolean }> => {
    if (!request.parentBrandId) throw new AppError('Model requests require a parentBrandId.', 400, 'CATALOG_REQUEST_PARENT_BRAND_REQUIRED');
    
    return resolveOrCreateEntity<ModelCreateInput, IModel>(request, session, {
        entityType: 'model',
        findExisting: (canonicalName, session) => CatalogModel.findOne({
            brandId: request.parentBrandId, canonicalName, ...NON_DELETED_QUERY,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
        }).session(session),
        findExistingAfterError: (canonicalName, session) => CatalogModel.findOne({
            brandId: request.parentBrandId, canonicalName, ...NON_DELETED_QUERY,
            approvalStatus: { $in: [CATALOG_APPROVAL_STATUS.APPROVED, CATALOG_APPROVAL_STATUS.PENDING] },
        }).session(session),
        createEntity: (data: ModelCreateInput, session: ClientSession) => CatalogModel.create([data], { session }),
        buildCreateData: (req, canonicalName) => ({
            name: req.requestedName, displayName: req.requestedName, canonicalName,
            slug: buildCatalogSlug(req.requestedName, 'model'), brandId: req.parentBrandId as Types.ObjectId,
            categoryIds: [req.categoryId], isActive: true, approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
            status: CATALOG_STATUS.ACTIVE, suggestedBy: req.requestedBy,
            marketplaceTrust: buildApprovalTrustMetadata({ requestCount: req.requestCount, createdCanonicalEntity: true }),
        }),
    });
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
    return model._id;
};
