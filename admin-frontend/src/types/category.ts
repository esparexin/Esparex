import { CategoryType } from '../../../shared/schemas/catalog.schema';
import type { CatalogStatusValue } from '../../../shared/enums/catalogStatus';

export interface Category {
    id: string;
    name: string;
    slug: string;
    type?: CategoryType;
    /** @see shared/enums/catalogStatus.ts */
    status?: CatalogStatusValue;
    icon?: string;
    description?: string;
    parentId?: string;
    hasScreenSizes: boolean;
    isActive: boolean;
    isDeleted: boolean;
    // Metadata-driven architecture fields
    listingType?: string[];
    createdAt?: string;
    updatedAt?: string;
}
