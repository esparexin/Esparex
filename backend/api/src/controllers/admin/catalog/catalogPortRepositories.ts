/**
 * Catalog admin repositories — backend-side adapters (P1-8, DECISION-GATE §2/§5).
 *
 * The generic catalog CRUD factory (`shared.ts`) performs its data access through
 * this narrow interface, whose implementations delegate to the catalog domain's
 * repository ports (resolved via `core/src/composition/catalog.ts`).
 * Admin catalog controllers must not import `@esparex/core/models/*` for data
 * access; the catalog domain owns all catalog persistence.
 */

import {
    getBrandRepository,
    getCategoryRepository,
    getModelRepository,
    getScreenSizeRepository,
    getServiceTypeRepository,
    getSparePartRepository,
} from '@esparex/core';
import type { Types } from 'mongoose';

/** Lean catalog entity as returned by the repository ports. */
export interface CatalogAdminEntity {
    readonly id: string;
    readonly _id?: string | { toString(): string };
    readonly isActive?: boolean;
    readonly isDeleted?: boolean;
    readonly approvalStatus?: unknown;
    readonly categoryIds?: Array<string | Types.ObjectId>;
    readonly categoryId?: string | Types.ObjectId;
    readonly brandId?: string | Types.ObjectId;
    readonly [key: string]: unknown;
}

/**
 * Uniform CRUD surface consumed by the admin catalog CRUD factory.
 * Each implementation is a thin pass-through to the matching catalog
 * repository port — no Mongoose model access in the backend.
 */
export interface CatalogAdminRepository {
    readonly entityName: string;
    /** Entity schema carries `categoryIds` (drives the activation guard). */
    readonly supportsCategoryIds: boolean;
    /** Entity schema carries `approvalStatus` (derived on toggle). */
    readonly supportsApprovalStatus: boolean;
    create(data: Record<string, unknown>): Promise<CatalogAdminEntity>;
    findById(id: string): Promise<CatalogAdminEntity | null>;
    findByIdIncludingDeleted(id: string): Promise<CatalogAdminEntity | null>;
    update(id: string, data: Record<string, unknown>): Promise<CatalogAdminEntity | null>;
}

type PortEntityLike = {
    id: string;
    _id?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    approvalStatus?: unknown;
    categoryIds?: readonly unknown[];
    categoryId?: unknown;
    brandId?: unknown;
};

const toEntity = (doc: PortEntityLike | null): CatalogAdminEntity | null => {
    if (!doc) return null;
    const { categoryIds, categoryId, brandId, ...rest } = doc;
    return {
        ...(rest as Record<string, unknown>),
        _id: doc._id ?? doc.id,
        categoryIds: categoryIds ? categoryIds.map(String) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        brandId: brandId ? String(brandId) : undefined,
    } as CatalogAdminEntity;
};

export const brandRepository: CatalogAdminRepository = {
    entityName: 'Brand',
    supportsCategoryIds: true,
    supportsApprovalStatus: true,
    create: async (data) => toEntity(await getBrandRepository().create(data)) as CatalogAdminEntity,
    findById: async (id) => toEntity(await getBrandRepository().findById(id)),
    findByIdIncludingDeleted: async (id) => toEntity(await getBrandRepository().findById(id, true)),
    update: async (id, data) => toEntity(await getBrandRepository().update(id, data)),
};

export const modelRepository: CatalogAdminRepository = {
    entityName: 'Model',
    supportsCategoryIds: true,
    supportsApprovalStatus: true,
    create: async (data) => toEntity(await getModelRepository().create(data)) as CatalogAdminEntity,
    findById: async (id) => toEntity(await getModelRepository().findById(id)),
    findByIdIncludingDeleted: async (id) => toEntity(await getModelRepository().findById(id, true)),
    update: async (id, data) => toEntity(await getModelRepository().update(id, data)),
};

export const categoryRepository: CatalogAdminRepository = {
    entityName: 'Category',
    supportsCategoryIds: false,
    supportsApprovalStatus: true,
    create: async (data) => toEntity(await getCategoryRepository().create(data)) as CatalogAdminEntity,
    findById: async (id) => toEntity(await getCategoryRepository().findById(id)),
    findByIdIncludingDeleted: async (id) => toEntity(await getCategoryRepository().findById(id, true)),
    update: async (id, data) => toEntity(await getCategoryRepository().update(id, data)),
};

export const sparePartRepository: CatalogAdminRepository = {
    entityName: 'SparePart',
    supportsCategoryIds: true,
    supportsApprovalStatus: true,
    create: async (data) => toEntity(await getSparePartRepository().create(data)) as CatalogAdminEntity,
    findById: async (id) => toEntity(await getSparePartRepository().findById(id)),
    findByIdIncludingDeleted: async (id) => toEntity(await getSparePartRepository().findById(id, true)),
    update: async (id, data) => toEntity(await getSparePartRepository().update(id, data)),
};

export const serviceTypeRepository: CatalogAdminRepository = {
    entityName: 'ServiceType',
    supportsCategoryIds: true,
    supportsApprovalStatus: true,
    create: async (data) => toEntity(await getServiceTypeRepository().create(data)) as CatalogAdminEntity,
    findById: async (id) => toEntity(await getServiceTypeRepository().findById(id)),
    findByIdIncludingDeleted: async (id) => toEntity(await getServiceTypeRepository().findById(id, true)),
    update: async (id, data) => toEntity(await getServiceTypeRepository().update(id, data)),
};

export const screenSizeRepository: CatalogAdminRepository = {
    entityName: 'ScreenSize',
    // ScreenSize carries `categoryId` (singular), not `categoryIds`.
    supportsCategoryIds: false,
    supportsApprovalStatus: true,
    create: async (data) => toEntity(await getScreenSizeRepository().create(data)) as CatalogAdminEntity,
    findById: async (id) => toEntity(await getScreenSizeRepository().findById(id)),
    findByIdIncludingDeleted: async (id) => toEntity(await getScreenSizeRepository().findById(id, true)),
    update: async (id, data) => toEntity(await getScreenSizeRepository().update(id, data)),
};
