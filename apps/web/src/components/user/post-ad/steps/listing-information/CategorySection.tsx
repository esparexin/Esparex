"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { CircuitBoard } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

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

    const GridContent = (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
            {dynamicCategories.map((cat) => {
                const Icon = cat.icon || CircuitBoard;
                const selected = cat.id === categoryId;
                return (
                    <Button 
                        key={cat.id} 
                        type="button" 
                        variant={selected ? "default" : "outline"} 
                        onClick={() => onCategoryClick(cat.id)} 
                        disabled={isEditMode && !selected}
                        aria-pressed={selected}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 h-20 py-2 px-1 rounded-xl transition-all duration-200 border-2", 
                            selected ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white hover:bg-slate-50 border-slate-100", 
                            isEditMode && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <Icon className={cn("w-6 h-6", selected ? "text-primary-foreground" : "text-foreground-subtle")} aria-hidden="true" focusable="false" />
                        <span className={cn("text-[10px] sm:text-xs font-semibold text-center leading-tight w-full px-1", selected ? "text-primary-foreground" : "text-foreground-tertiary", !selected && "whitespace-normal break-words line-clamp-2")}>
                            {cat.name}
                        </span>
                    </Button>
                );
            })}
        </div>
    );

    return (
        <section className="space-y-3" aria-labelledby="category-heading">
            <h2 id="category-heading" className="sr-only">Category</h2>
            <Field error={categoryError as string} label="Select Category" required>
                {GridContent}
            </Field>
        </section>
    );
}
