"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Check,
    ChevronDown,
    X,
    Search,
    Z_INDEX,
} from "@esparex/ui";
import { cn } from "@/lib/utils";

interface CatalogItem {
    id?: string;
    _id?: string;
    name?: string;
}

export interface CatalogSelectDropdownProps {
    items: CatalogItem[];
    value: string | string[];
    onChange: (val: string | string[]) => void;
    multiSelect?: boolean;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    id?: string;
}

export function CatalogSelectDropdown({
    items,
    value,
    onChange,
    multiSelect = false,
    placeholder = "Select an option...",
    disabled = false,
    error,
    id,
}: CatalogSelectDropdownProps) {
    const generatedId = useId();
    const resolvedId = id || `catalog-select-${generatedId}`;

    // ── Single-Select Mode (Spare Part Type) ─────────────────────────
    if (!multiSelect) {
        const singleVal = typeof value === "string" ? value : "";
        return (
            <div className="w-full space-y-1.5">
                <Select
                    value={singleVal}
                    onValueChange={(newVal) => onChange(newVal)}
                    disabled={disabled}
                >
                    <SelectTrigger
                        id={resolvedId}
                        aria-invalid={Boolean(error)}
                        className={cn(
                            "h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-background shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                            error && "border-destructive ring-destructive/20",
                            disabled && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    {/* design-token-ignore: z-index must use Z_INDEX token via inline style per zIndex.ts governance */}
                    <SelectContent className="max-h-60 rounded-xl border-border bg-popover text-popover-foreground shadow-lg" style={{ zIndex: Z_INDEX.alertDialogOverlay }}>
                        {items.map((item) => {
                            const itemId = item.id || (item._id as string);
                            return (
                                <SelectItem
                                    key={itemId}
                                    value={itemId}
                                    className="cursor-pointer text-body py-2.5 px-3 rounded-lg focus:bg-accent focus:text-accent-foreground"
                                >
                                    {item.name}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // ── Multi-Select Mode (Service Types) ────────────────────────────
    return (
        <MultiSelectCatalogDropdown
            items={items}
            value={Array.isArray(value) ? value : value ? [value] : []}
            onChange={(selected) => onChange(selected)}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            id={resolvedId}
        />
    );
}

function MultiSelectCatalogDropdown({
    items,
    value,
    onChange,
    placeholder,
    disabled,
    error,
    id,
}: {
    items: CatalogItem[];
    value: string[];
    onChange: (val: string[]) => void;
    placeholder: string;
    disabled: boolean;
    error?: string;
    id: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);

    const filteredItems = React.useMemo(() => {
        if (!search.trim()) return items;
        const query = search.toLowerCase().trim();
        return items.filter((item) => (item.name || "").toLowerCase().includes(query));
    }, [items, search]);

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            listboxRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }, 60);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener("mousedown", handleOutsideClick);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const handleToggleItem = (itemId: string) => {
        const next = value.includes(itemId)
            ? value.filter((id) => id !== itemId)
            : [...value, itemId];
        onChange(next);
    };

    const handleRemoveChip = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter((id) => id !== itemId));
    };

    const selectedItems = items.filter((item) => {
        const itemId = item.id || (item._id as string);
        return value.includes(itemId);
    });

    return (
        <div ref={containerRef} className="relative w-full space-y-2">
            <button
                type="button"
                id={id}
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={cn(
                    "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-left text-body-lg md:text-body font-normal text-foreground shadow-2xs transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                    error && "border-destructive ring-destructive/20",
                    disabled && "cursor-not-allowed opacity-60"
                )}
            >
                <span className={cn("truncate", value.length === 0 && "text-foreground-subtle")}>
                    {value.length === 0
                        ? placeholder
                        : `${value.length} selected (${selectedItems.map((i) => i.name).join(", ")})`}
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-foreground-subtle transition-transform duration-200", open && "rotate-180")} />
            </button>

            {/* Selected chips summary for fast review & removal */}
            {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedItems.map((item) => {
                        const itemId = item.id || (item._id as string);
                        return (
                            <span
                                key={itemId}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-caption font-medium text-primary shadow-2xs"
                            >
                                <span>{item.name}</span>
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveChip(itemId, e)}
                                        aria-label={`Remove ${item.name}`}
                                        className="rounded-full hover:bg-primary/20 p-0.5 text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Dropdown Options List */}
            {open && (
                <div
                    ref={listboxRef}
                    role="listbox"
                    aria-multiselectable="true"
                    className="absolute top-full left-0 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 scroll-mb-6"
                    // design-token-ignore: z-index must use Z_INDEX token via inline style per zIndex.ts governance
                    style={{ zIndex: Z_INDEX.alertDialogOverlay }}
                >
                    {items.length > 5 && (
                        <div className="p-1 mb-1 border-b border-border">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border">
                                <Search className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search options..."
                                    className="w-full bg-transparent text-body-lg md:text-caption font-normal text-foreground placeholder:font-normal placeholder:text-foreground-subtle focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                    {filteredItems.length === 0 ? (
                        <div className="p-3 text-center text-caption text-foreground-subtle">
                            {search ? `No options matching "${search}"` : "No options available"}
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const itemId = item.id || (item._id as string);
                            const isSelected = value.includes(itemId);
                            return (
                                <button
                                    key={itemId}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleToggleItem(itemId)}
                                    className={cn(
                                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-body transition-colors select-none",
                                        isSelected
                                            ? "bg-primary/10 font-medium text-primary"
                                            : "text-foreground-secondary hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                            isSelected
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-card"
                                        )}
                                    >
                                        {isSelected && <Check className="h-3 w-3 stroke-2" />}
                                    </div>
                                    <span className="truncate">{item.name}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
