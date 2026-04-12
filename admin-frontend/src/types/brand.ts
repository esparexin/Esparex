import type { CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface Brand {
    id: string;
    name: string;
    categoryId?: string; // Legacy
    categoryIds?: string[];
    status: CatalogStatusValue;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}
