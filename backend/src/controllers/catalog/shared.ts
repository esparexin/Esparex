/**
 * Shared utilities for catalog controllers
 * Extracted from original catalog.content.controller.ts
 *
 * Validation logic is delegated to CatalogValidationService (SSOT).
 * Re-exports keep existing controller imports stable.
 */

import { Request, Response } from 'express';
import { Document, Model as MongooseModel } from 'mongoose';
import Category from '../../models/Category';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { CatalogStatusValue } from '../../../../shared/enums/catalogStatus';
import { ACTIVE_CATEGORY_QUERY } from '../../services/catalog/CatalogValidationService';
export type { CatalogStatusValue };

// Re-export SSOT validation helpers so controllers import from one place.
export {
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
} from '../../services/catalog/CatalogValidationService';

export type CatalogRequest = Request & {
    user?: { role?: string; id?: string; _id?: string | { toString: () => string } };
    admin?: { id?: string; _id?: string | { toString: () => string } };
};

export type QueryRecord = Record<string, unknown>;

/**
 * Check if request has admin access
 */
export const hasAdminAccess = (req: Request): boolean => {
    const catalogRequest = req as CatalogRequest;
    const role = catalogRequest.user?.role;
    return role === 'admin' || role === 'super_admin';
};

/**
 * Extract admin actor ID from request context
 */
export const getAdminActorId = (req: Request): string | undefined => {
    const catalogRequest = req as CatalogRequest;
    const userId = catalogRequest.user?._id ?? catalogRequest.user?.id;
    if (typeof userId === 'string') return userId;
    if (userId && typeof userId.toString === 'function') return userId.toString();
    const adminId = catalogRequest.admin?._id ?? catalogRequest.admin?.id;
    if (typeof adminId === 'string') return adminId;
    if (adminId && typeof adminId.toString === 'function') return adminId.toString();
    return undefined;
};

/**
 * Type-safe model wrapper
 */
export const asModel = <T extends Document>(model: MongooseModel<T>): MongooseModel<T> => model;

/** Backwards-compat helper — prefer CatalogValidationService.validateCategoryIsActive */
export const isCategoryActive = async (categoryId: string): Promise<boolean> => {
    const exists = await Category.exists({ _id: categoryId, ...ACTIVE_CATEGORY_QUERY });
    return Boolean(exists);
};

/**
 * Send standardized catalog error response
 */
export const sendCatalogError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Catalog operation failed';
    sendContractErrorResponse(req, res, 500, message);
};

