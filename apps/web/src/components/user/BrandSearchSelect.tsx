"use client";

import { useMemo } from "react";
import { CatalogSearchSelect } from "./CatalogSearchSelect";

interface BrandSearchSelectProps {
    brands: string[];
    brandMap: Record<string, { id?: string; _id?: string; name?: string } | undefined>;
    /** Currently selected brand display name or ObjectId. */
    value: string;
    /** Called with (brandId, brandName, requestId) on selection */
    onChange: (brandId: string, brandName: string, requestId?: string) => void;
    categoryId: string;
    disabled?: boolean;
    loading?: boolean;
    placeholder?: string;
    className?: string;
}

export function BrandSearchSelect({
    brands,
    brandMap,
    value,
    onChange,
    disabled = false,
    loading = false,
    placeholder = "Search brand...",
    className,
}: BrandSearchSelectProps) {
    const selectedName = useMemo(() => {
        if (!value) return "";
        if (brandMap[value]) return value;
        const foundByEntry = Object.values(brandMap).find((b) => b?.id === value || b?._id === value);
        if (foundByEntry) return foundByEntry.name || value;
        return value;
    }, [value, brandMap]);

    return (
        <CatalogSearchSelect<string>
            items={brands}
            loading={loading}
            value={value}
            displayValue={selectedName}
            placeholder={placeholder}
            title="Select a Brand"
            emptyMessage="No matching brands found"
            disabled={disabled}
            className={className}
            getLabel={(brand) => brand}
            getId={(brand) => brandMap[brand]?.id ?? brandMap[brand]?._id ?? brand}
            onSelect={(brandName) => {
                const id = brandMap[brandName]?.id ?? brandMap[brandName]?._id ?? brandName;
                onChange(id, brandName);
            }}
            onClear={() => onChange("", "")}
        />
    );
}
