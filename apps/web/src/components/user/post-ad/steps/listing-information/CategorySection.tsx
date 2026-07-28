"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { CircuitBoard } from "@/icons/IconRegistry";
import { Field } from "@/components/ui/field";
import { CategorySelectorGrid } from "@/components/user/shared/ListingFormFields";
import { getNestedFieldMeta } from "../common/utils";

export function CategorySection() {
    const { dynamicCategories } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts } = usePostAdFlow();
    const { watch, handleCategoryChange } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const { touchedFields, errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const categoryError = (shouldShowFieldError("categoryId") || shouldShowFieldError("category")) ? (errors.categoryId?.message ?? errors.category?.message) : undefined;

    const onCategoryClick = useCallback((catId: string) => {
        if (isEditMode) return;
        handleCategoryChange(catId);
    }, [isEditMode, handleCategoryChange]);

    return (
        <section className="space-y-2" aria-labelledby="category-heading">
            <h2 id="category-heading" className="sr-only">Category</h2>
            <Field error={categoryError as string} label="Select Category" required>
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
