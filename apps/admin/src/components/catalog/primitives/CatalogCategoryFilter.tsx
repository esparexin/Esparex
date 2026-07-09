"use client";

import { CatalogSelectFilter } from "./CatalogSelectFilter";
import type { NamedEntityOption } from "./types";

export function CatalogCategoryFilter({
    categories,
    value,
    onChange,
    withFilterIcon = false,
    allLabel = "All Categories",
}: {
    categories: NamedEntityOption[];
    value: string;
    onChange: (value: string) => void;
    withFilterIcon?: boolean;
    allLabel?: string;
}) {
    return (
        <CatalogSelectFilter
            withFilterIcon={withFilterIcon}
            value={value}
            onChange={onChange}
            options={[
                { value: "all", label: allLabel },
                ...categories.flatMap((category) => (category.id ? [{ value: category.id, label: category.name }] : [])),
            ]}
        />
    );
}
