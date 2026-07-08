"use client";

import { CatalogSelectFilter } from "./CatalogSelectFilter";

export function CatalogActiveStatusFilter({
    value,
    onChange,
    withFilterIcon = false,
}: {
    value: string;
    onChange: (value: string) => void;
    withFilterIcon?: boolean;
}) {
    return (
        <CatalogSelectFilter
            withFilterIcon={withFilterIcon}
            value={value}
            onChange={onChange}
            options={[
                { value: "all", label: "All Status" },
                { value: "live", label: "Live Only" },
                { value: "inactive", label: "Inactive Only" },
            ]}
        />
    );
}
