"use client";

import { Label } from "@esparex/ui";
import { FormError } from "@esparex/ui";
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
    autoFocusCategory?: boolean;
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
    autoFocusCategory = false,
}: SmartAlertCategoryBrandModelFieldsProps) {
    return (
        <>
            {/* Category (SSOT) */}
            <div className="relative z-20">
                <Label htmlFor="alert-category" className="text-body font-semibold text-foreground mb-1.5 block">
                    Category <span className="text-destructive">*</span>
                </Label>
                <EntitySearchCombobox<Category>
                    items={categories}
                    loading={isLoadingCategories}
                    value={formData.category}
                    placeholder="Select Category..."
                    title="Category"
                    emptyMessage="No categories found"
                    autoFocus={autoFocusCategory}
                    onSelect={(cat) => updateFormData({ category: cat.name, brand: "", model: "" })}
                    onClear={() => updateFormData({ category: "", brand: "", model: "" })}
                    getLabel={(cat) => cat.name}
                    getId={(cat) => cat.id || cat.slug || cat.name}
                />
                <FormError message={errors?.category} />
            </div>

            {/* Brand & Model responsive grid (Post Ad Step 1 layout pattern) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
                {/* Brand (Mandatory SSOT) */}
                <div className="relative z-10">
                    <Label htmlFor="alert-brand" className="text-body font-semibold text-foreground mb-1.5 block">
                        Brand <span className="text-destructive">*</span>
                    </Label>
                    <EntitySearchCombobox<Brand>
                        items={brands}
                        loading={isLoadingBrands}
                        disabled={!formData.category}
                        value={formData.brand || ""}
                        placeholder={!formData.category ? "Select Category first" : "Select Brand..."}
                        title="Brand"
                        emptyMessage="No brands found"
                        onSelect={(b) => updateFormData({ brand: b.name, model: "" })}
                        onClear={() => updateFormData({ brand: "", model: "" })}
                        getLabel={(b) => b.name}
                        getId={(b) => b.id || b._id || b.name}
                    />
                    <FormError message={errors?.brand} />
                </div>

                {/* Model (Optional SSOT) */}
                <div className="relative z-10">
                    <Label htmlFor="alert-model" className="text-body font-semibold text-foreground mb-1.5 block">
                        Model
                    </Label>
                    <EntitySearchCombobox<DeviceModel>
                        items={models}
                        loading={isLoadingModels}
                        disabled={!formData.brand}
                        value={formData.model || ""}
                        placeholder={!formData.brand ? "Select Brand first" : "Select Model..."}
                        title="Model"
                        emptyMessage="No models found"
                        onSelect={(m) => updateFormData({ model: m.name, keywords: "" })}
                        onClear={() => updateFormData({ model: "" })}
                        getLabel={(m) => m.name}
                        getId={(m) => m.id || m._id || m.name}
                    />
                </div>
            </div>
        </>
    );
}
