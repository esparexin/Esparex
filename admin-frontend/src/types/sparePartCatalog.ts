import type { CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface ISparePartAdmin {
    id: string;
    name: string;
    slug: string;
    listingType: string[];
    categoryIds: string[];
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}

