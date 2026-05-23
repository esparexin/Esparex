"use client";

import { useState, useRef, useLayoutEffect, useMemo, useEffect, type CSSProperties } from "react";
import { Check, Search, Loader2, Plus } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Z_INDEX } from "@/lib/zIndexConfig";
import { usePostAd } from "@/components/user/post-ad/PostAdContext";
import type { DeviceModel } from "@/lib/api/user/masterData";
import { CatalogRequestDialog } from "./CatalogRequestDialog";

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
    onRequestSuccess?: (requestId: string, name: string) => void | Promise<void>;
    /** Reserved callback for parent brand sync in async catalog flows. */
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
    const { availableModels, loadModelsForBrand } = usePostAd();
    
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

    // Local selection bridges the gap during prop/context sync.
    // Only consulted when selectedModel (from catalog) is not yet available.
    const [localSelection, setLocalSelection] = useState<{ id: string; name: string } | null>(null);

    // Resolve selected model name.
    // Priority: matched model in list > local tentative selection > explicit displayName > raw value
    const selectedModel = useMemo(() => {
        return availableModels.find(m => m.id === value || m._id === value);
    }, [availableModels, value]);

    // If selectedModel is present in the catalog, localSelection is superseded — no effect needed.
    const selectedName = selectedModel?.name || (!selectedModel ? localSelection?.name : null) || modelDisplayName || value || "";
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

    // Dropdown positioning — only runs when isEditing or search is active.
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const calculate = () => {
            const rect = container.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                maxHeight: Math.min(300, Math.max(spaceBelow - 8, 80)),
            });
        };

        calculate();
        window.addEventListener("scroll", calculate, true);
        window.addEventListener("resize", calculate);
        return () => {
            window.removeEventListener("scroll", calculate, true);
            window.removeEventListener("resize", calculate);
            setDropdownStyle(null);
        };
    }, [isEditing, search]);


    const handleSelect = (model: DeviceModel) => {
        const id = String(model.id || model._id);
        const name = model.name;
        setLocalSelection({ id, name });
        onChange(id, name);
        setSearch("");
        setIsEditing(false);
    };

    const hasCanonicalBrandId = /^[0-9a-f]{24}$/i.test(brandId);
    const canRequestModel = Boolean(categoryId) && hasCanonicalBrandId;

    const trimmedSearch = search.trim();
    const hasExactApprovedMatch = useMemo(() => {
        return availableModels.some((m) => m.name.toLowerCase() === trimmedSearch.toLowerCase());
    }, [availableModels, trimmedSearch]);

    const showSuggestButton =
        trimmedSearch.length >= 2 &&
        !hasExactApprovedMatch &&
        !isLoading &&
        !disabled &&
        canRequestModel;

    const handleAddNew = () => {
        const trimmed = search.trim();
        if (!trimmed) return;
        if (!categoryId) {
            return;
        }
        if (!hasCanonicalBrandId) {
            return;
        }
        setIsRequestDialogOpen(true);
    };

    const requestDialog = (
        <CatalogRequestDialog
            open={isRequestDialogOpen}
            onOpenChange={setIsRequestDialogOpen}
            requestType="model"
            categoryId={categoryId}
            parentBrandId={brandId}
            initialName={search}
            onSuccess={() => {
                setSearch("");
                setIsEditing(false);
            }}
        />
    );

    // ── Selected State ──────────────────────────────────────────────────────
    if (selectedName && !isEditing) {
        return (
            <>
                <div className={cn(
                    "flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 transition-all hover:bg-slate-100/50",
                    className
                )}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="truncate text-sm font-semibold text-foreground">{selectedName}</span>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="ml-2 shrink-0 text-xs font-bold text-primary hover:opacity-80 active:scale-95 transition-all"
                        >
                            Edit
                        </button>
                    )}
                </div>
                {requestDialog}
            </>
        );
    }

    // ── Search State ────────────────────────────────────────────────────────
    return (
        <div 
            className={cn("relative", className)} 
            ref={containerRef}
            style={{ zIndex: isEditing ? Z_INDEX.brandSearchBackdrop + 1 : undefined }}
        >
            <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    )}
                </div>
                <Input
                    autoFocus={isEditing}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && search.length >= 2 && showSuggestButton) {
                            e.preventDefault();
                            handleAddNew();
                        }
                        if (e.key === "Escape") {
                            setIsEditing(false);
                            setSearch("");
                        }
                    }}
                    onFocus={() => setIsEditing(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "pl-10 h-12 text-sm font-medium border-slate-200/80 rounded-xl transition-all",
                        "focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-sm",
                        showSuggestButton ? "pr-12" : "pr-4"
                    )}
                />
                {showSuggestButton && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddNew();
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:text-primary transition-all"
                        aria-label="Suggest model"
                        title="Suggest model"
                    >
                        <Plus className="w-[18px] h-[18px]" />
                    </button>
                )}
            </div>
            {search && !canRequestModel ? (
                <p className="mt-1 px-1 text-xs font-semibold text-amber-700">
                    {categoryId ? "Select an approved brand first." : "Select a category first."}
                </p>
            ) : null}

            {(isEditing || search) && availableModels.length > 0 && dropdownStyle && (
                <>
                    <div
                        style={{ zIndex: Z_INDEX.brandSearchBackdrop }}
                        className="fixed inset-0"
                        onClick={() => {
                            setIsEditing(false);
                            setSearch("");
                        }}
                    />
                    <div
                        style={{ ...dropdownStyle, zIndex: Z_INDEX.selectContent }}
                        className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        <div className="overflow-y-auto max-h-[280px] p-1.5 space-y-1">
                            {availableModels.map((m) => (
                                <button
                                    key={String(m.id || m._id)}
                                    type="button"
                                    onClick={() => handleSelect(m)}
                                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all hover:bg-primary/5 hover:text-primary active:bg-primary/10 flex items-center justify-between group rounded-lg"
                                >
                                    <span>{m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {requestDialog}
        </div>
    );
}
