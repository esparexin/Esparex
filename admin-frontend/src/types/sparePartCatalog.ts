import type { CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface ISparePartAdmin {
    id: string;
    name: string;
    slug: string;
    listingType: string[];
    categoryIds: string[];
    isActive: boolean;
    /** CatalogStatusValue + 'approved' (spare-part-specific transition state) */
    status: CatalogStatusValue | 'approved';
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}

