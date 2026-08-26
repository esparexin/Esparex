"use client";

import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/FormError";
import { EntitySearchCombobox } from "@/components/user/EntitySearchCombobox";
import type { Category } from "@/lib/api/user/categories";
import type { Brand, DeviceModel } from "@/lib/api/user/masterData";
import type { SmartAlertFieldErrors, SmartAlertFormData } from "../types";

interface SmartAlertCategoryBrandModelFieldsProps {
    categories: Category[];
    brands: Brand[];
    models: DeviceModel[];
    isLoadingCategories: boolean;
    isLoadingBrands: boolean;
    isLoadingModels: boolean;
    formData: SmartAlertFormData;
    updateFormData: (updates: Partial<SmartAlertFormData>) => void;
    errors?: SmartAlertFieldErrors;
}

export function SmartAlertCategoryBrandModelFields({
    categories,
    brands,
    models,
    isLoadingCategories,
    isLoadingBrands,
    isLoadingModels,
    formData,
    updateFormData,
    errors,
}: SmartAlertCategoryBrandModelFieldsProps) {
    return (
        <>
            {/* Category (SSOT) */}
            <div>
                <Label htmlFor="alert-category" className="text-caption font-semibold text-foreground mb-1.5 block">
                    Category <span className="text-destructive">*</span>
                </Label>
                <EntitySearchCombobox<Category>
                    items={categories}
                    loading={isLoadingCategories}
                    value={formData.category}
                    placeholder="Select Category..."
                    title="Select Category"
                    emptyMessage="No categories found"
                    onSelect={(cat) => updateFormData({ category: cat.name, brand: "", model: "" })}
                    onClear={() => updateFormData({ category: "", brand: "", model: "" })}
                    getLabel={(cat) => cat.name}
                    getId={(cat) => cat.id || cat.slug || cat.name}
                />
                <FormError message={errors?.category} />
            </div>

            {/* Brand (Mandatory SSOT) */}
            <div>
                <Label htmlFor="alert-brand" className="text-caption font-semibold text-foreground mb-1.5 block">
                    Brand <span className="text-destructive">*</span>
                </Label>
                <EntitySearchCombobox<Brand>
                    items={brands}
                    loading={isLoadingBrands}
                    disabled={!formData.category}
                    value={formData.brand || ""}
                    placeholder="Select Brand..."
                    title="Select Brand"
                    emptyMessage="No brands found"
                    onSelect={(b) => updateFormData({ brand: b.name, model: "" })}
                    onClear={() => updateFormData({ brand: "", model: "" })}
                    getLabel={(b) => b.name}
                    getId={(b) => b.id || b._id || b.name}
                />
                <FormError message={errors?.brand} />
            </div>

            {/* Model (Optional SSOT) */}
            <div>
                <Label htmlFor="alert-model" className="text-caption font-semibold text-foreground mb-1.5 block">
                    Model
                </Label>
                <EntitySearchCombobox<DeviceModel>
                    items={models}
                    loading={isLoadingModels}
                    disabled={!formData.brand}
                    value={formData.model || ""}
                    placeholder="Select Model..."
                    title="Select Model"
                    emptyMessage="No models found"
                    onSelect={(m) => updateFormData({ model: m.name, keywords: "" })}
                    onClear={() => updateFormData({ model: "" })}
                    getLabel={(m) => m.name}
                    getId={(m) => m.id || m._id || m.name}
                />
            </div>
        </>
    );
}
