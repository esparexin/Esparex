"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { CircuitBoard } from "@/icons/IconRegistry";
import { Field } from "@/components/ui/field";
import { CategorySelectorGrid } from "@/components/user/shared/ListingFormFields";
import { useStepFieldError } from "../common/Utils";

export function CategorySection() {
    const { dynamicCategories } = usePostAdCatalog();
    const { isEditMode } = usePostAdFlow();
    const { watch, handleCategoryChange } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const getFieldError = useStepFieldError(1);
    const categoryError = getFieldError("categoryId") || getFieldError("category");

    const onCategoryClick = useCallback((catId: string) => {
        if (isEditMode) return;
        handleCategoryChange(catId);
    }, [isEditMode, handleCategoryChange]);

    return (
        <section className="space-y-2" aria-labelledby="category-heading">
            <h2 id="category-heading" className="sr-only">Category</h2>
            <Field error={categoryError as string} label="Select Category" labelClassName="text-sm font-medium" required>
                <CategorySelectorGrid
                    categories={dynamicCategories}
                    selectedCategoryId={categoryId}
                    onSelect={onCategoryClick}
                    disabled={isEditMode}
                    defaultIcon={CircuitBoard}
                />
            </Field>
        </section>
    );
}
