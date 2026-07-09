"use client";
export type ModelFormData = {
    name: string;
    brandId: string;
    categoryIds: string[];
    parentModelId?: string | null;
    variantOfModelId?: string | null;
    isParentModel?: boolean;
    isActive: boolean;
};
