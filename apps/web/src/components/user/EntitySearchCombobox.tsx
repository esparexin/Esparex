"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { Search, Loader2, X, Plus, ChevronDown } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { Input } from "@esparex/ui";
import { Sheet, SheetContent, SheetTitle } from "@esparex/ui";
import { useIsMobile } from "@/hooks/useMobile";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { EntitySearchOptionsList } from "./EntitySearchOptionsList";

export interface EntitySearchComboboxProps<T> {
    items: T[];
    loading?: boolean;
    value: string;
    displayValue?: string;
    placeholder?: string;
    title?: string;
    emptyMessage?: string;
    disabled?: boolean;
    isCustom?: boolean;
    className?: string;
    onSelect: (item: T) => void;
    onClear?: () => void;
    onSearchChange?: (search: string) => void;
    onProposeCustom?: (customName: string) => void;
    proposeType?: 'brand' | 'model';
    autoFocus?: boolean;
    getLabel: (item: T) => string;
    getId: (item: T) => string;
    renderItem?: (item: T, isSelected: boolean) => ReactNode;
}

export function EntitySearchCombobox<T>({
    items,
    loading = false,
    value,
    displayValue,
    placeholder = "Search...",
    title = "Select Option",
    emptyMessage = "No items found",
    disabled = false,
    isCustom = false,
    className,
    autoFocus = false,
    onSelect,
    onClear,
    onSearchChange,
    onProposeCustom,
    proposeType = 'brand',
    getLabel,
    getId,
    renderItem,
}: EntitySearchComboboxProps<T>) {
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);
    // responsive-exception: dynamic sheet-vs-dropdown routing (layout itself is single-instance CSS).
    const isMobile = useIsMobile();

    const selectedName = displayValue || value || "";

    const sanitizedTitle = useMemo(
        () => title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/(^-|-$)/g, "") || "options",
        [title]
    );
    const listboxId = `select-options-list-${sanitizedTitle}`;

    const filteredItems = useMemo(() => {
        if (!search) return items;
        const query = search.toLowerCase().trim();
        return items.filter((item) => getLabel(item).toLowerCase().includes(query));
    }, [items, search, getLabel]);

    const isListOpen = Boolean((isEditing || search) && !disabled);

    const handleItemSelect = (item: T) => { onSelect(item); setSearch(""); setIsEditing(false); };
    const handleProposeCustom = (customName: string) => {
        if (!onProposeCustom || !customName.trim()) return;
        onProposeCustom(customName.trim());
        setSearch("");
        setIsEditing(false);
    };
    const handleClose = () => { setIsEditing(false); setSearch(""); };

    const { activeIndex, setActiveIndex, handleKeyDown } = useListKeyboardNavigation({
        items: filteredItems,
        isOpen: isListOpen,
        onSelect: handleItemSelect,
        onClose: handleClose,
    });

    const activeOptionId = activeIndex >= 0 ? `select-option-${sanitizedTitle}-${activeIndex}` : undefined;

    // Pre-focus matching item on opening when a value is pre-selected
    useEffect(() => {
        if (!isListOpen || !value) return;
        const idx = filteredItems.findIndex((item) => getId(item) === value || getLabel(item) === value);
        if (idx >= 0) setActiveIndex(idx);
    }, [isListOpen, value, filteredItems, getId, getLabel, setActiveIndex]);

    // Synchronize keyboard focus / activeIndex with auto-scrolling
    useEffect(() => {
        if (activeIndex < 0 || !isListOpen) return;
        document.getElementById(`select-option-${sanitizedTitle}-${activeIndex}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [activeIndex, isListOpen, sanitizedTitle]);

    // Safely focus mobile drawer search input after slide animation with preventScroll
    useEffect(() => {
        if (!isListOpen || !isMobile) return;
        const timer = setTimeout(() => {
            mobileInputRef.current?.focus({ preventScroll: true });
        }, 150);
        return () => clearTimeout(timer);
    }, [isListOpen, isMobile]);

    // Close dropdown on click outside for desktop listbox
    useEffect(() => {
        if (!isListOpen || isMobile) return;
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const container = containerRef.current;
            const dropdownEl = document.getElementById(listboxId);
            const target = event.target as Node;
            if (container && !container.contains(target) && dropdownEl && !dropdownEl.contains(target)) handleClose();
        };
        const evts: Array<"mousedown" | "touchstart"> = ["mousedown", "touchstart"];
        evts.forEach((e) => document.addEventListener(e, handleClickOutside));
        return () => evts.forEach((e) => document.removeEventListener(e, handleClickOutside));
    }, [isListOpen, isMobile, listboxId]);

    const desktopDropdownContent = (
        <div
            id={listboxId}
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1.5 max-h-60 bg-popover border border-border rounded-xl shadow-xl overflow-y-auto z-50 p-1.5 overscroll-contain touch-pan-y"
        >
            <EntitySearchOptionsList
                items={filteredItems}
                loading={loading}
                activeIndex={activeIndex}
                isMobileView={false}
                emptyMessage={emptyMessage}
                sanitizedTitle={sanitizedTitle}
                getLabel={getLabel}
                getId={getId}
                renderItem={renderItem}
                onSelect={handleItemSelect}
            />
        </div>
    );

    return (
        <div
            className={cn("relative", className)}
            ref={containerRef}
        >
            <div className="relative group">
                {loading && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                )}
                <Input
                    autoFocus={autoFocus && !isMobile}
                    value={search || (isEditing ? "" : selectedName)}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearch(val);
                        onSearchChange?.(val);
                    }}
                    onClick={() => {
                        if (!disabled) setIsEditing(true);
                    }}
                    onFocus={() => {
                        if (!isMobile && !disabled) setIsEditing(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={loading ? "Loading options..." : placeholder}
                    disabled={disabled}
                    className={cn(
                        "pl-3 h-11 text-body-lg md:text-body font-normal text-foreground placeholder:font-normal placeholder:text-foreground-subtle border-border rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer",
                        loading ? "pr-14" : "pr-9"
                    )}
                    role="combobox"
                    aria-expanded={isListOpen}
                    aria-haspopup="listbox"
                    aria-controls={isListOpen ? listboxId : undefined}
                    aria-activedescendant={activeOptionId}
                    autoComplete="off"
                />

                {/* Clean inline + / X controls on the right side of the input field */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {isCustom || (selectedName && !isEditing) ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearch("");
                                onClear?.();
                            }}
                            title="Remove selection"
                            aria-label="Remove selection"
                            className="min-h-8 min-w-8 p-1.5 rounded-md text-foreground-secondary hover:text-destructive hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : search.trim() && onProposeCustom ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProposeCustom(search);
                            }}
                            title={`Add "${search.trim()}" as custom ${proposeType}`}
                            aria-label={`Add "${search.trim()}" as custom ${proposeType}`}
                            className="min-h-8 min-w-8 p-1.5 rounded-md text-destructive hover:text-destructive hover:bg-destructive-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <Plus className="w-5 h-5 font-bold stroke-[2.5]" />
                        </button>
                    ) : (
                        <ChevronDown className="w-4 h-4 text-foreground-subtle pointer-events-none" />
                    )}
                </div>
            </div>

            {/* Listbox overlay */}
            {isListOpen && (
                isMobile ? (
                    <Sheet open={true} onOpenChange={(open) => { if (!open) handleClose(); }}>
                        <SheetContent
                            side="bottom"
                            className="max-h-[min(65vh,calc(var(--visual-viewport-height,100dvh)-6rem))] px-2 pb-2"
                        >
                            <SheetTitle className="sr-only">{title}</SheetTitle>
                            <div className="flex flex-col">
                                <div className="sticky top-0 bg-surface pt-1 pb-3 px-1 z-10 border-b border-border mb-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                                    <Input
                                        ref={mobileInputRef}
                                        id={`drawer-search-input-${sanitizedTitle}`}
                                        value={search}
                                        onChange={(e) => {
                                             const val = e.target.value;
                                             setSearch(val);
                                             onSearchChange?.(val);
                                        }}
                                        placeholder={placeholder}
                                        className="pl-9 pr-10 h-10 text-body-lg md:text-body font-normal text-foreground border-border rounded-xl shadow-sm placeholder:font-normal placeholder:text-foreground-subtle"
                                    />
                                    {search.trim() && onProposeCustom && (
                                        <button
                                             type="button"
                                             onClick={() => handleProposeCustom(search)}
                                             title={`Add "${search.trim()}" as custom ${proposeType}`}
                                             aria-label={`Add "${search.trim()}" as custom ${proposeType}`}
                                             className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-8 min-w-8 p-1.5 rounded-md text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                             <Plus className="w-5 h-5 font-bold stroke-[2.5]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div id={listboxId} role="listbox" className="flex flex-col gap-1 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <EntitySearchOptionsList
                                    items={filteredItems}
                                    loading={loading}
                                    activeIndex={activeIndex}
                                    isMobileView
                                    emptyMessage={emptyMessage}
                                    sanitizedTitle={sanitizedTitle}
                                    getLabel={getLabel}
                                    getId={getId}
                                    renderItem={renderItem}
                                    onSelect={handleItemSelect}
                                />
                            </div>
                        </div>
                        </SheetContent>
                    </Sheet>
                ) : (
                    desktopDropdownContent
                )
            )}
        </div>
    );
}
