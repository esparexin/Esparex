"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Check, ChevronDown, Z_INDEX } from "@esparex/ui";
import { cn } from "@/lib/utils";

export interface MultiBrandSearchSelectProps {
    brands: string[];
    brandMap: Record<string, { id?: string; _id?: string; name?: string } | undefined>;
    values: string[];
    onChange: (selectedIds: string[], selectedNames: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    error?: string;
    id?: string;
}

export function MultiBrandSearchSelect({
    brands,
    brandMap,
    values,
    onChange,
    disabled = false,
    placeholder = "Search and select compatible brands...",
    error,
    id = "multi-brand-select",
}: MultiBrandSearchSelectProps) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Rule: Strictly NO "Universal" or "All brands" options allowed
    const sanitizedBrands = useMemo(() => {
        return brands.filter((brand) => {
            const lower = brand.toLowerCase().trim();
            return lower !== "universal" && lower !== "all brands" && !lower.includes("universal");
        });
    }, [brands]);

    // Filter brands by query
    const filteredBrands = useMemo(() => {
        if (!search.trim()) return sanitizedBrands;
        const query = search.toLowerCase().trim();
        return sanitizedBrands.filter((b) => b.toLowerCase().includes(query));
    }, [sanitizedBrands, search]);

    // Resolve display names for selected values
    const selectedBrandEntries = useMemo(() => {
        return values.map((val) => {
            if (brandMap[val]?.name) {
                return { id: val, name: brandMap[val]?.name || val };
            }
            const found = Object.values(brandMap).find((b) => b?.id === val || b?._id === val);
            if (found?.name) {
                return { id: val, name: found.name };
            }
            return { id: val, name: val };
        });
    }, [values, brandMap]);

    // Handle outside click & escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                setSearch("");
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleToggleBrand = (brandName: string) => {
        const idOrName = brandMap[brandName]?.id ?? brandMap[brandName]?._id ?? brandName;
        if (values.includes(idOrName)) {
            // If already selected, clicking it unselects it
            handleRemoveBrand(idOrName);
        } else {
            // If not selected, select it
            const nextIds = [...values, idOrName];
            const nextNames = [...selectedBrandEntries.map((b) => b.name), brandName];
            onChange(nextIds, nextNames);
        }
        inputRef.current?.focus();
    };

    const handleRemoveBrand = (removeId: string) => {
        const nextIds = values.filter((id) => id !== removeId);
        const nextNames = selectedBrandEntries.filter((b) => b.id !== removeId).map((b) => b.name);
        onChange(nextIds, nextNames);
    };

    return (
        <div ref={containerRef} className="relative w-full space-y-2">
            {/* Input trigger area */}
            <div
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(true);
                        inputRef.current?.focus();
                    }
                }}
                className={cn(
                    "flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 shadow-2xs transition-all cursor-text",
                    isOpen && "ring-2 ring-primary/20 border-primary",
                    error && "border-destructive ring-destructive/20",
                    disabled && "cursor-not-allowed opacity-60 bg-muted/30"
                )}
            >
                <Search className="h-4 w-4 shrink-0 text-foreground-subtle" />
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    disabled={disabled}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={values.length === 0 ? placeholder : "Add another brand..."}
                    className="flex-1 bg-transparent text-body-lg md:text-body font-normal text-foreground placeholder:font-normal placeholder:text-foreground-subtle focus:outline-none min-w-[120px]"
                />
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 text-foreground-subtle transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </div>

            {/* Selected Brand Chips */}
            {selectedBrandEntries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {selectedBrandEntries.map((brand) => (
                        <span
                            key={brand.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-caption font-medium text-primary shadow-2xs"
                        >
                            <span>{brand.name}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveBrand(brand.id);
                                    }}
                                    aria-label={`Remove ${brand.name}`}
                                    className="rounded-full hover:bg-primary/20 p-0.5 text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* Dropdown list */}
            {isOpen && (
                <div
                    role="listbox"
                    aria-multiselectable="true"
                    className="absolute top-full left-0 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
                    // design-token-ignore: z-index must use Z_INDEX token via inline style per zIndex.ts governance
                    style={{ zIndex: Z_INDEX.alertDialogOverlay }}
                >
                    {filteredBrands.length === 0 ? (
                        <div className="p-3 text-center text-caption text-foreground-subtle">
                            {search ? `No brands matching "${search}"` : "No brands available"}
                        </div>
                    ) : (
                        filteredBrands.map((brandName) => {
                            const idOrName = brandMap[brandName]?.id ?? brandMap[brandName]?._id ?? brandName;
                            const isSelected = values.includes(idOrName);
                            return (
                                <button
                                    key={brandName}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleToggleBrand(brandName)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-body transition-colors select-none",
                                        isSelected
                                            ? "bg-primary/10 font-medium text-primary"
                                            : "text-foreground-secondary hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <span>{brandName}</span>
                                    {isSelected && <Check className="h-4 w-4 stroke-2 text-primary" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
