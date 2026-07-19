import mongoose, { type Types, type ClientSession } from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import { AppError } from '../../utils/AppError';
import { ACTIVE_CATEGORY_QUERY, normalizeCatalogCanonicalName } from '../catalog/CatalogValidationService';
import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import type { ICatalogRequest } from '../../models/CatalogRequest';
import CatalogRequest from '../../models/CatalogRequest';

const NON_DELETED_QUERY = { isDeleted: { $ne: true }, deletedAt: null };

const ACTIVE_BRAND_APPROVAL_QUERY = {
    ...NON_DELETED_QUERY, isActive: true,
    approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
};

export { NON_DELETED_QUERY, ACTIVE_BRAND_APPROVAL_QUERY };

export const assertValidObjectId = (value: string, fieldName: string): Types.ObjectId => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`Invalid ${fieldName}`, 400, 'INVALID_OBJECT_ID', { field: fieldName, value });
    }
    return new mongoose.Types.ObjectId(value);
};

export const buildCatalogSlug = (name: string, prefix: 'brand' | 'model'): string => {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    if (!baseSlug) return `${prefix}-${nanoid(6)}`;
    return `${baseSlug}-${nanoid(5)}`;
};

export const resolveRequestCanonicalName = (request: ICatalogRequest): string => (
    request.canonicalName || request.normalizedName || normalizeCatalogCanonicalName(request.requestedName)
);

export const assertPendingRequest = (request: ICatalogRequest): void => {
    const isWaiting = ['pending', 'under_review', 'duplicate_review'].includes(request.status);
    if (!isWaiting) {
        throw new AppError('Only pending catalog requests can be reviewed.', 409, 'CATALOG_REQUEST_NOT_PENDING');
    }
};

export const assertRequestCategoryIsActive = async (request: ICatalogRequest, session: ClientSession): Promise<void> => {
    const activeCategory = await Category.findOne({ _id: request.categoryId, ...ACTIVE_CATEGORY_QUERY }).session(session);
    if (!activeCategory) {
        throw new AppError('Catalog request category is inactive or no longer available.', 409, 'CATALOG_REQUEST_CATEGORY_INACTIVE');
    }
};

export const assertParentBrandIsActiveForModelRequest = async (request: ICatalogRequest, session: ClientSession): Promise<void> => {
    if (request.requestType !== 'model') return;
    if (!request.parentBrandId) throw new AppError('Model requests require a parentBrandId.', 400, 'CATALOG_REQUEST_PARENT_BRAND_REQUIRED');
    const parentBrand = await Brand.findOne({ _id: request.parentBrandId, ...ACTIVE_BRAND_APPROVAL_QUERY }).session(session);
    if (!parentBrand) {
        throw new AppError('Model request parent brand is inactive or no longer available.', 409, 'CATALOG_REQUEST_PARENT_BRAND_INACTIVE');
    }
};

export const coerceOptionalNotes = (value: string | null | undefined): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const hasObjectId = (items: unknown, target: Types.ObjectId): boolean => {
    if (!Array.isArray(items)) return false;
    const targetValue = String(target);
    return items.some((item) => String(item) === targetValue);
};

export const loadRequestForReview = async (requestId: Types.ObjectId, session: ClientSession): Promise<ICatalogRequest> => {
    const request = await CatalogRequest.findById(requestId).session(session);
    if (!request) throw new AppError('Catalog request not found.', 404, 'CATALOG_REQUEST_NOT_FOUND');
    assertPendingRequest(request);
    return request;
};
