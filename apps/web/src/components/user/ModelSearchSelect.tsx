"use client";

import { useMemo, useEffect, useCallback } from "react";
import { CatalogSearchSelect } from "./CatalogSearchSelect";
import { usePostAdCatalog, usePostAdAction } from "@/components/user/post-ad/context";
import type { DeviceModel } from "@/lib/api/user/masterData";

interface ModelSearchSelectProps {
    brandId: string;
    brandName?: string;
    categoryId: string;
    value: string;
    modelDisplayName?: string;
    onChange: (modelId: string, modelName: string, requestId?: string) => void;
    onBrandResolved?: (brandId: string, brandName: string) => void;
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
    const { availableModels, isLoadingModels } = usePostAdCatalog();
    const { loadModelsForBrand } = usePostAdAction();

    const selectedModel = useMemo(() => {
        return availableModels.find((m) => m.id === value || m._id === value);
    }, [availableModels, value]);

    const selectedName = selectedModel?.name || modelDisplayName || value || "";

    const handleSearchChange = useCallback((search: string) => {
        if (!search || search.length < 2) return;
        void loadModelsForBrand(brandId, categoryId, search);
    }, [brandId, categoryId, loadModelsForBrand]);

    useEffect(() => {
        if (brandId) {
            void loadModelsForBrand(brandId, categoryId);
        }
    }, [brandId, categoryId, loadModelsForBrand]);

    return (
        <CatalogSearchSelect<DeviceModel>
            items={availableModels}
            loading={isLoadingModels}
            value={value}
            displayValue={selectedName}
            placeholder={placeholder}
            title="Select a Model"
            emptyMessage="No matching models found"
            disabled={disabled}
            className={className}
            getLabel={(m) => m.name}
            getId={(m) => String(m.id || m._id)}
            onSearchChange={handleSearchChange}
            onSelect={(m) => {
                const id = String(m.id || m._id);
                onChange(id, m.name);
            }}
            onClear={() => onChange("", "")}
        />
    );
}
