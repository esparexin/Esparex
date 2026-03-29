import type { ListingTypeValue } from '../../../shared/enums/listingType';

export interface ISparePartAdmin {
    id: string;
    name: string;
    slug: string;
    listingType: ListingTypeValue[];
    categoryIds: string[];
    brandId?: string;
    modelId?: string;
    sortOrder?: number;
    usageCount?: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}
