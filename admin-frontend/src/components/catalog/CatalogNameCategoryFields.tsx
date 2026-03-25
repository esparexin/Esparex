"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { CategoryAssignmentField } from "@/components/catalog/CategoryAssignmentField";
import { CatalogTextInputField } from "@/components/catalog/CatalogUiPrimitives";

type CategoryOption = {
    id: string;
    name: string;
    hint?: string;
    tone?: "default" | "danger";
    title?: string;
};

export function CatalogNameCategoryFields({
    nameLabel,
    namePlaceholder,
    nameValue,
    onNameChange,
    categoryLabel,
    categorySelectedIds,
    categoryOptions,
    onCategoryChange,
    categoryLayout,
    categoryNotice,
    categoryFooter,
}: {
    nameLabel: ReactNode;
    namePlaceholder: string;
    nameValue: string;
    onNameChange: (value: string) => void;
    categoryLabel: ReactNode;
    categorySelectedIds: string[];
    categoryOptions: CategoryOption[];
    onCategoryChange: (ids: string[]) => void;
    categoryLayout?: "grid" | "list";
    categoryNotice?: ReactNode;
    categoryFooter?: ReactNode;
}) {
    return (
        <>
            <CatalogTextInputField
                label={nameLabel}
                placeholder={namePlaceholder}
                value={nameValue}
                onChange={onNameChange}
            />
            <CategoryAssignmentField
                label={categoryLabel}
                layout={categoryLayout}
                selectedIds={categorySelectedIds}
                options={categoryOptions}
                notice={categoryNotice}
                footer={categoryFooter}
                onChange={onCategoryChange}
            />
        </>
    );
}

type NameCategoryFormData = {
    name: string;
    categoryIds: string[];
};

export function CatalogBoundNameCategoryFields<TFormData extends NameCategoryFormData>({
    formData,
    setFormData,
    nameLabel,
    namePlaceholder,
    categoryLabel,
    categoryOptions,
    categoryLayout,
    categoryNotice,
    categoryFooter,
}: {
    formData: TFormData;
    setFormData: Dispatch<SetStateAction<TFormData>>;
    nameLabel: ReactNode;
    namePlaceholder: string;
    categoryLabel: ReactNode;
    categoryOptions: CategoryOption[];
    categoryLayout?: "grid" | "list";
    categoryNotice?: ReactNode;
    categoryFooter?: ReactNode;
}) {
    return (
        <CatalogNameCategoryFields
            nameLabel={nameLabel}
            namePlaceholder={namePlaceholder}
            nameValue={formData.name}
            onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
            categoryLabel={categoryLabel}
            categoryLayout={categoryLayout}
            categorySelectedIds={formData.categoryIds}
            categoryOptions={categoryOptions}
            categoryNotice={categoryNotice}
            categoryFooter={categoryFooter}
            onCategoryChange={(categoryIds) => setFormData((prev) => ({ ...prev, categoryIds }))}
        />
    );
}
