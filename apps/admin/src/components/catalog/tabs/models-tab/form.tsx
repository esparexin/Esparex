"use client";

import type { Dispatch, SetStateAction } from "react";
import { Model, Brand } from "@esparex/contracts";
import type { ModelFormData } from "./types";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { CatalogSelectField, CatalogArchivedCategoryNotice } from "@/components/catalog/primitives";
import { getEntityCategoryIds } from "@/components/catalog/catalogDomainUtils";

export function ModelsFormRenderer({ formData, setFormData, brands, categoryOptions, archivedCategoryCount }: {
    formData: ModelFormData;
    setFormData: Dispatch<SetStateAction<ModelFormData>>;
    isEditing?: boolean;
    editingItem?: Model;
    brands: Brand[];
    categoryOptions: { id: string; name: string }[];
    parentModelOptions?: Model[];
    archivedCategoryCount: number;
}) {
    const formBrands = formData.categoryIds.length > 0
        ? brands.filter((brand) => getEntityCategoryIds(brand).some((cid) => formData.categoryIds.includes(cid)))
        : brands;

    return (
        <>
            <CatalogBoundNameCategoryFields
                formData={formData}
                setFormData={setFormData}
                nameLabel="Model Name"
                namePlaceholder="e.g. iPhone 15 Pro"
                categoryLabel="Assigned Categories"
                categoryOptions={categoryOptions}
                categoryNotice={<CatalogArchivedCategoryNotice archivedCategoryCount={archivedCategoryCount} />}
            />
            <div className="grid grid-cols-2 gap-4">
                <CatalogSelectField label="Brand" value={formData.brandId}
                    onChange={(brandId) => setFormData((prev) => ({ ...prev, brandId, parentModelId: null, variantOfModelId: null }))}
                    options={formBrands.map((b) => ({ value: b.id, label: b.name }))} placeholder="Select Brand" required />
            </div>
        </>
    );
}
