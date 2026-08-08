"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import { CategorySelectorGrid } from "@/components/user/shared/ListingFormFields";
import { Tag } from "@/icons/IconRegistry";

export function CategorySection() {
    const { dynamicCategories } = usePostAdCatalog();
    const { isEditMode } = usePostAdFlow();
    const { watch, handleCategoryChange } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");

    const onCategoryClick = useCallback((catId: string) => {
        if (isEditMode) return;
        handleCategoryChange(catId);
    }, [isEditMode, handleCategoryChange]);



    return (
        <section className="flex flex-col gap-2" aria-labelledby="category-heading">
            <h2 id="category-heading" className="sr-only">Category</h2>
            <FieldRoot<any>
                name="categoryId"
                render={() => (
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel required className="text-sm font-semibold">Category</FieldLabel>
                        <FieldControl animateOnError>
                            <CategorySelectorGrid
                                categories={dynamicCategories}
                                selectedCategoryId={categoryId}
                                onSelect={onCategoryClick}
                                disabled={isEditMode}
                                defaultIcon={Tag}
                            />
                        </FieldControl>
                        <FieldMessage />
                    </div>
                )}
            />
        </section>
    );
}
