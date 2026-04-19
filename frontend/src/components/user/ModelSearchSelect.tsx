"use client";

import { useState, useRef, useLayoutEffect, useMemo, useEffect, type CSSProperties } from "react";
import { Check, Search, Plus, Clock, Loader2 } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Z_INDEX } from "@/lib/zIndexConfig";
import { usePostAd } from "@/components/user/post-ad/PostAdContext";
import type { DeviceModel } from "@/lib/api/user/masterData";
import { ensureModel } from "@/lib/api/user/masterData";

interface ModelSearchSelectProps {
    brandId: string;
    /** Display name of the selected brand — used for ensureModel when brandId is empty (custom brand). */
    brandName?: string;
    categoryId: string;
    /** Currently selected modelId or modelName */
    value: string;
    /** Called with (modelId, modelName) on selection */
    onChange: (modelId: string, modelName: string) => void;
    /**
     * Called after ensureModel creates a new brand record so the parent can
     * sync the pending brandId back into the form.
     */
    onBrandResolved?: (brandId: string, brandName: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function ModelSearchSelect({
    brandId,
    brandName = "",
    categoryId,
    value,
    onChange,
    onBrandResolved,
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

    // Resolve selected model name
    const selectedModel = useMemo(() => {
        return availableModels.find(m => m.id === value || m._id === value);
    }, [availableModels, value]);

    const selectedName = selectedModel?.name || value || "";

    // Debounced search logic
    useEffect(() => {
        if (!search || search.length < 2) return;
        
        const timer = setTimeout(async () => {
            setIsLoading(true);
            await loadModelsForBrand(brandId, categoryId, search);
            setIsLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [search, brandId, categoryId, loadModelsForBrand]);

    // Initial load of popular models
    useEffect(() => {
        if (brandId && !search) {
            loadModelsForBrand(brandId, categoryId);
        }
    }, [brandId, categoryId, loadModelsForBrand, search]);

    // Dropdown positioning
    useLayoutEffect(() => {
        if (!isEditing && !search) {
            setDropdownStyle(null);
            return;
        }
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
        };
    }, [isEditing, search]);

    const handleSelect = (model: DeviceModel) => {
        onChange(String(model.id || model._id), model.name);
        setSearch("");
        setIsEditing(false);
    };

    const [isEnsuring, setIsEnsuring] = useState(false);

    const handleAddNew = async () => {
        const trimmed = search.trim();
        if (!trimmed || !categoryId) return;

        // Resolve brand identifier: prefer the DB id, fall back to the display name
        // (custom brand typed by user that isn't in the DB yet).
        const effectiveBrandName = brandName || brandId;
        if (!effectiveBrandName) return;

        setIsEnsuring(true);
        try {
            const result = await ensureModel(categoryId, effectiveBrandName, trimmed);
            // If a new pending brand was created, propagate its ID to the parent form.
            if (result.brandId && (!brandId || brandId !== result.brandId)) {
                onBrandResolved?.(result.brandId, brandName || effectiveBrandName);
            }
            onChange(result.id, result.name);
        } catch {
            // Silent fail — user stays on the field and can retry.
        } finally {
            setIsEnsuring(false);
            setSearch("");
            setIsEditing(false);
        }
    };

    // ── Selected State ──────────────────────────────────────────────────────
    if (selectedName && !isEditing) {
        return (
            <div className={cn(
                "flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 transition-all hover:bg-slate-100/50",
                className
            )}>
                <div className="flex items-center gap-2.5 min-w-0">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="truncate text-sm font-semibold text-foreground">{selectedName}</span>
                    {selectedModel?.status === 'pending' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            Pending
                        </span>
                    )}
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
        );
    }

    // ── Search State ────────────────────────────────────────────────────────
    return (
        <div className={cn("relative", className)} ref={containerRef}>
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
                    onFocus={() => setIsEditing(true)}
                    placeholder={placeholder}
                    disabled={disabled || isEnsuring}
                    className={cn(
                        "pl-10 pr-12 h-12 text-sm font-medium border-slate-200/80 rounded-xl transition-all",
                        "focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-sm"
                    )}
                />
                {search.length >= 2 && !isLoading && (
                    <button
                        type="button"
                        onClick={handleAddNew}
                        disabled={isEnsuring}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                        title={`Add "${search}" as a new suggestion`}
                    >
                        {isEnsuring ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>

            {(isEditing || search) && dropdownStyle && (
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
                        <div className="overflow-y-auto max-h-[240px] p-1">
                            {availableModels.length === 0 && !isLoading && !search && (
                                <div className="py-8 px-4 text-center text-sm text-slate-400 font-medium italic">
                                    Start typing to find your model...
                                </div>
                            )}

                            {availableModels.map((m) => (
                                <button
                                    key={String(m.id || m._id)}
                                    type="button"
                                    onClick={() => handleSelect(m)}
                                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-all hover:bg-primary/5 hover:text-primary active:bg-primary/10 flex items-center justify-between group rounded-lg"
                                >
                                    <span>{m.name}</span>
                                    {m.status === 'pending' && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                            New
                                        </span>
                                    )}
                                </button>
                            ))}


                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
