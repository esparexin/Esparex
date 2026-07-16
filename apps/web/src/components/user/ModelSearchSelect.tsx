"use client";

import { useState, useMemo, useEffect } from "react";
import { AsyncSearchSelect } from "@/components/ui/AsyncSearchSelect";
import { usePostAd } from "@/components/user/post-ad/PostAdContext";
import type { DeviceModel } from "@/lib/api/user/masterData";

interface ModelSearchSelectProps {
    brandId: string;
    /** Display name of the selected brand, retained for catalog-request linkage UX. */
    brandName?: string;
    categoryId: string;
    /** Currently selected modelId or modelName */
    value: string;
    /** Human-readable display name for the current value — used when value is an ObjectId not in availableModels */
    modelDisplayName?: string;
    /** Called with (modelId, modelName, requestId) on selection */
    onChange: (modelId: string, modelName: string, requestId?: string) => void;
    /** Reserved callback for parent brand sync in async catalog flows. */
    onBrandResolved?: (brandId: string, brandName: string) => void;
    onRequestSuccess?: (requestId: string, name: string) => void | Promise<void>;
    onCreateModel?: (brandId: string, categoryId: string, name: string, listingId?: string) => Promise<{ status: string; id?: string; message?: string }>;
    listingId?: string;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function ModelSearchSelect({
    brandId,
    categoryId,
    value,
    modelDisplayName = "",
    onChange,
    disabled = false,
    placeholder = "Search model (e.g. iPhone 14 Pro)...",
    className,
}: ModelSearchSelectProps) {
    const { availableModels, loadModelsForBrand } = usePostAd();
    
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Resolve selected model name cleanly from React Query catalog SSOT or RHF prop value without local selection state.
    const selectedModel = useMemo(() => {
        return availableModels.find(m => m.id === value || m._id === value);
    }, [availableModels, value]);

    const selectedName = selectedModel?.name || modelDisplayName || value || "";

    useEffect(() => {
        if (!search || search.length < 2) return;

        const timer = setTimeout(() => {
            void (async () => {
                setIsLoading(true);
                await loadModelsForBrand(brandId, categoryId, search);
                setIsLoading(false);
            })();
        }, 400);

        return () => clearTimeout(timer);
    }, [search, brandId, categoryId, loadModelsForBrand]);

    // Initial load of popular models
    useEffect(() => {
        if (brandId && !search) {
            loadModelsForBrand(brandId, categoryId);
        }
    }, [brandId, categoryId, loadModelsForBrand, search]);

    const handleSelect = (model: DeviceModel) => {
        const id = String(model.id || model._id);
        const name = model.name;
        onChange(id, name);
        setSearch("");
        setIsEditing(false);
    };

    const handleClear = () => {
        onChange("", "");
        setSearch("");
        setIsEditing(false);
    };

    const canRequestModel = Boolean(categoryId) && /^[0-9a-f]{24}$/i.test(brandId);
    const errorText = search && !canRequestModel
        ? (categoryId ? "Select an approved brand first." : "Select a category first.")
        : null;

    const dropdownContent = (isEditing || search) && availableModels.length > 0 ? (
        <div className="overflow-y-auto max-h-[280px] p-1.5 space-y-1" role="listbox">
            {availableModels.map((m) => (
                <button
                    key={String(m.id || m._id)}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        handleSelect(m);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all hover:bg-primary/5 hover:text-primary active:bg-primary/10 flex items-center justify-between group rounded-lg"
                >
                    <span>{m.name}</span>
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
            isLoading={isLoading}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            selectedName={selectedName}
            onClear={handleClear}
            dropdownContent={dropdownContent}
            className={className}
            errorText={errorText}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    setIsEditing(false);
                    setSearch("");
                }
            }}
        />
    );
}
