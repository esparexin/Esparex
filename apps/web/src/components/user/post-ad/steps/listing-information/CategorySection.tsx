"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { CircuitBoard } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {dynamicCategories.map((cat) => {
                const Icon = cat.icon || CircuitBoard;
                const selected = cat.id === categoryId;
                return (
                    <button 
                        key={cat.id} 
                        type="button" 
                        onClick={() => onCategoryClick(cat.id)} 
                        disabled={isEditMode && !selected}
                        aria-pressed={selected}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 h-[68px] sm:h-[72px] py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer select-none group border", 
                            selected 
                                ? "bg-blue-50/90 border-2 border-blue-600 text-blue-950 font-bold shadow-sm ring-2 ring-blue-600/15" 
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-2xs", 
                            isEditMode && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <Icon 
                            className={cn(
                                "w-5 h-5 sm:w-6 sm:h-6 transition-colors", 
                                selected ? "text-blue-600 stroke-[2.2]" : "text-slate-400 group-hover:text-blue-600"
                            )} 
                            aria-hidden="true" 
                            focusable="false" 
                        />
                        <span className={cn(
                            "text-[11px] sm:text-xs font-semibold text-center leading-tight tracking-tight w-full px-0.5", 
                            selected ? "text-blue-950 font-bold" : "text-slate-700 group-hover:text-slate-900 line-clamp-2"
                        )}>
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );

    return (
        <section className="space-y-2" aria-labelledby="category-heading">
            <h2 id="category-heading" className="sr-only">Category</h2>
            <Field error={categoryError as string} label="Select Category" required>
                {GridContent}
            </Field>
        </section>
    );
}
