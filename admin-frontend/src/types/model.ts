import type { CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface Model {
    id: string;
    name: string;
    brandId: string;
    categoryId: string;
    categoryIds?: string[];
    isActive: boolean;
    /** @see shared/enums/catalogStatus.ts */
    status: CatalogStatusValue;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}

