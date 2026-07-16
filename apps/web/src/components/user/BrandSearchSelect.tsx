"use client";

import { useState, useMemo } from "react";
import { AsyncSearchSelect } from "@/components/ui/AsyncSearchSelect";

interface BrandSearchSelectProps {
    brands: string[];
    brandMap: Record<string, { id?: string } | undefined>;
    /** Currently selected brand display name. */
    value: string;
    /** Called with (brandId, brandName, requestId) on selection */
    onChange: (brandId: string, brandName: string, requestId?: string) => void;
    categoryId: string;
    onRequestSuccess?: (requestId: string, name: string) => void | Promise<void>;
    onCreateBrand?: (categoryId: string, name: string, listingId?: string) => Promise<{ status: string; id?: string; message?: string }>;
    listingId?: string;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function BrandSearchSelect({
    brands,
    brandMap,
    value,
    onChange,
    categoryId,
    disabled = false,
    placeholder = "Search brand...",
    className,
}: BrandSearchSelectProps) {
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const selectedName = value ?? "";
    const canRequestBrand = Boolean(categoryId);

    const filtered = useMemo(
        () =>
            search
                ? brands.filter((b) => b.toLowerCase().includes(search.toLowerCase()))
                : brands,
        [brands, search]
    );

    const handleSelect = (brandName: string) => {
        const id = brandMap[brandName]?.id ?? brandName;
        onChange(id, brandName);
        setSearch("");
        setIsEditing(false);
    };

    const handleClear = () => {
        onChange("", "");
        setSearch("");
        setIsEditing(false);
    };

    const errorText = search && !canRequestBrand ? "Select a category first." : null;

    const dropdownContent = search && filtered.length > 0 ? (
        <div className="overflow-y-auto max-h-[240px] p-1.5 space-y-1" role="listbox">
            {filtered.slice(0, 10).map((b) => (
                <button
                    key={b}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        handleSelect(b);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-foreground-secondary transition-colors hover:bg-slate-50 active:bg-slate-100 rounded-lg"
                >
                    {b}
                </button>
            ))}
        </div>
    ) : null;

    return (
        <AsyncSearchSelect
            search={search}
            onSearchChange={setSearch}
            placeholder={placeholder}
            disabled={disabled}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            selectedName={selectedName}
            onClear={handleClear}
            dropdownContent={dropdownContent}
            className={className}
            errorText={errorText}
        />
    );
}
