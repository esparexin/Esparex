"use client";

import type { Dispatch, SetStateAction } from "react";
import { Model, Brand } from "@esparex/contracts";
import type { ModelFormData } from "./types";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";
import { CatalogBoundNameCategoryFields } from "@/components/catalog/CatalogNameCategoryFields";
import { CatalogSelectField } from "@/components/catalog/CatalogUiPrimitives";
import { CatalogArchivedCategoryNotice } from "@/components/catalog/CatalogUiPrimitives";
import { getEntityCategoryIds } from "@/components/catalog/catalogDomainUtils";

export function ModelsFormRenderer({ formData, setFormData, isEditing, editingItem, brands, categoryOptions, parentModelOptions, archivedCategoryCount }: {
    formData: ModelFormData;
    setFormData: Dispatch<SetStateAction<ModelFormData>>;
    isEditing: boolean;
    editingItem?: Model;
    brands: Brand[];
    categoryOptions: { id: string; name: string }[];
    parentModelOptions: Model[];
    archivedCategoryCount: number;
}) {
    const formBrands = formData.categoryIds.length > 0
        ? brands.filter((brand) => getEntityCategoryIds(brand).some((cid) => formData.categoryIds.includes(cid)))
        : brands;
    const hierarchyOptions = parentModelOptions
        .filter((m) => m.id !== editingItem?.id)
        .filter((m) => !formData.brandId || normalizeObjectIdLike(m.brandId) === formData.brandId)
        .map((m) => ({ value: m.id, label: m.name }));

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
            <div className="grid grid-cols-2 gap-4">
                <CatalogSelectField label="Parent Model" value={formData.parentModelId || ""}
                    onChange={(parentModelId) => setFormData((prev) => ({ ...prev, parentModelId: parentModelId || null, variantOfModelId: null, isParentModel: parentModelId ? false : prev.isParentModel }))}
                    options={hierarchyOptions} placeholder="No parent model" />
                <CatalogSelectField label="Variant Of" value={formData.variantOfModelId || ""}
                    onChange={(variantOfModelId) => setFormData((prev) => ({ ...prev, variantOfModelId: variantOfModelId || null, parentModelId: variantOfModelId || prev.parentModelId || null, isParentModel: variantOfModelId ? false : prev.isParentModel }))}
                    options={hierarchyOptions} placeholder="Not a variant" />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    checked={Boolean(formData.isParentModel)}
                    onChange={(event) => setFormData((prev) => ({ ...prev, isParentModel: event.target.checked }))}
                    disabled={Boolean(formData.parentModelId || formData.variantOfModelId)} />
                Parent model
            </label>
        </>
    );
}
