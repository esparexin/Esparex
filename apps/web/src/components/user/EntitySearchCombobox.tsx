"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { Search, Loader2, X, Plus, ChevronDown } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Drawer } from "@esparex/ui";
import { useIsMobile } from "@/components/ui/useMobile";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

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
    const isMobile = useIsMobile();

    const selectedName = displayValue || value || "";

    const filteredItems = useMemo(() => {
        if (!search) return items;
        const query = search.toLowerCase().trim();
        return items.filter((item) => getLabel(item).toLowerCase().includes(query));
    }, [items, search, getLabel]);

    const isListOpen = Boolean((isEditing || search) && !disabled);

    const handleItemSelect = (item: T) => {
        onSelect(item);
        setSearch("");
        setIsEditing(false);
    };

    const handleProposeCustom = (customName: string) => {
        if (!onProposeCustom || !customName.trim()) return;
        onProposeCustom(customName.trim());
        setSearch("");
        setIsEditing(false);
    };

    const handleClose = () => {
        setIsEditing(false);
        setSearch("");
    };

    const { activeIndex, handleKeyDown } = useKeyboardNavigation({
        items: filteredItems,
        isOpen: isListOpen,
        onSelect: handleItemSelect,
        onClose: handleClose,
    });

    const activeOptionId = activeIndex >= 0 ? `select-option-${activeIndex}` : undefined;

    // Close dropdown on click outside for desktop listbox
    useEffect(() => {
        if (!isListOpen || isMobile) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const container = containerRef.current;
            const dropdownEl = document.getElementById("select-options-list");
            const target = event.target as Node;
            if (
                container &&
                !container.contains(target) &&
                dropdownEl &&
                !dropdownEl.contains(target)
            ) {
                handleClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isListOpen, isMobile]);

    const renderOptionsList = (isMobileView: boolean) => {
        if (loading) {
            return (
                <div className="p-4 text-center text-body text-foreground-subtle flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading...</span>
                </div>
            );
        }
        if (filteredItems.length === 0) {
            return (
                <div className="p-4 text-center text-body font-medium text-foreground-secondary">
                    {emptyMessage}
                </div>
            );
        }
        return filteredItems.map((item, idx) => {
            const label = getLabel(item);
            const id = getId(item);
            const isSelected = activeIndex === idx;
            return (
                <button
                    key={id || label}
                    id={`select-option-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={isMobileView ? undefined : (e) => e.preventDefault()}
                    onClick={() => handleItemSelect(item)}
                    className={cn(
                        "w-full px-4 py-2.5 text-left text-body font-medium text-foreground-secondary transition-colors hover:bg-muted active:bg-muted cursor-pointer select-none",
                        isMobileView ? "min-h-[44px] rounded-xl flex items-center" : "",
                        isSelected && (isMobileView ? "bg-muted text-link-dark font-semibold" : "bg-muted text-link-dark font-bold")
                    )}
                >
                    {renderItem ? renderItem(item, isSelected) : label}
                </button>
            );
        });
    };

    const desktopDropdownContent = (
        <div
            id="select-options-list"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1.5 max-h-[220px] bg-popover border border-border rounded-xl shadow-xl overflow-y-auto z-50 py-1.5 overscroll-contain touch-pan-y"
        >
            {renderOptionsList(false)}
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
                    autoFocus={isEditing}
                    value={search || (isEditing ? "" : selectedName)}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearch(val);
                        onSearchChange?.(val);
                    }}
                    onFocus={() => setIsEditing(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={loading ? "Loading options..." : placeholder}
                    disabled={disabled}
                    className="pl-3 pr-9 h-11 text-body font-normal sm:font-medium border-border rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary cursor-pointer placeholder:text-caption sm:placeholder:text-body"
                    role="combobox"
                    aria-expanded={isListOpen}
                    aria-haspopup="listbox"
                    aria-controls="select-options-list"
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
                            className="p-1 rounded-md text-foreground-subtle hover:text-destructive hover:bg-muted transition-colors"
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
                            className="p-1 rounded-md text-destructive hover:text-destructive hover:bg-destructive-subtle transition-colors"
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
                    <Drawer
                        title={title}
                        open={true}
                        onOpenChange={(open) => {
                            if (!open) handleClose();
                        }}
                    >
                        <div className="flex flex-col max-h-[70vh] px-2 pb-4">
                            <div className="sticky top-0 bg-surface pt-1 pb-3 px-1 z-10 border-b border-border mb-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                                    <Input
                                        autoFocus
                                        value={search}
                                        onChange={(e) => {
                                             const val = e.target.value;
                                             setSearch(val);
                                             onSearchChange?.(val);
                                        }}
                                        placeholder={placeholder}
                                        className="pl-9 pr-10 h-10 text-body font-normal sm:font-medium border-border rounded-xl shadow-2xs placeholder:text-caption sm:placeholder:text-body"
                                    />
                                    {search.trim() && onProposeCustom && (
                                        <button
                                            type="button"
                                            onClick={() => handleProposeCustom(search)}
                                            title={`Add "${search.trim()}" as custom ${proposeType}`}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-primary hover:bg-muted transition-colors"
                                        >
                                            <Plus className="w-5 h-5 font-bold stroke-[2.5]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div id="select-options-list" role="listbox" className="flex flex-col gap-1 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {renderOptionsList(true)}
                            </div>
                        </div>
                    </Drawer>
                ) : (
                    desktopDropdownContent
                )
            )}
        </div>
    );
}
