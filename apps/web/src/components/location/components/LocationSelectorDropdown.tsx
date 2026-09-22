"use client";

import { useEffect, useRef } from "react";
import { Input } from "@esparex/ui";
import { Search, MapPin, Target, Loader2 } from "@esparex/ui";
import { cn } from "@/lib/utils";

export interface LocationSelectorDropdownProps {
    inputRef: React.RefObject<HTMLInputElement>;
    hasSelection: boolean;
    selectedLabel: string;
    query: string;
    setQuery: (val: string) => void;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    selectedIndex: number;
    disabled?: boolean;
    error?: string;
    className?: string;
    isSearching: boolean;
    isDetecting: boolean;
    detectFeedback?: string | null;
    handleClear: () => void;
    handleSelectedFieldActivate: () => void;
    handleKeyDown: (event: React.KeyboardEvent) => void;
    onDetect: () => void;
    children: React.ReactNode;
}

export function LocationSelectorDropdown({
    inputRef,
    hasSelection,
    selectedLabel,
    query,
    setQuery,
    isOpen,
    setIsOpen,
    selectedIndex,
    disabled,
    error,
    className,
    isSearching,
    isDetecting,
    detectFeedback,
    handleClear,
    handleSelectedFieldActivate,
    handleKeyDown,
    onDetect,
    children,
}: LocationSelectorDropdownProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent | PointerEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
            setIsOpen(false);
            if (!hasSelection && query.length < 2) setQuery("");
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener("pointerdown", handleClickOutside);
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [hasSelection, isOpen, query, setIsOpen, setQuery]);

    return (
        <div className="relative space-y-2" ref={containerRef}>
            <div className="relative">
                <div className="absolute left-3 top-3 z-10 text-muted-foreground">
                    {hasSelection ? <MapPin className="w-5 h-5 text-primary" /> : <Search className="w-5 h-5" />}
                </div>
                <Input
                    ref={inputRef}
                    value={hasSelection ? selectedLabel : query}
                    readOnly={hasSelection}
                    role="combobox"
                    aria-expanded={isOpen && !hasSelection}
                    aria-haspopup="listbox"
                    aria-controls="location-results-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={selectedIndex >= 0 ? `location-option-${selectedIndex}` : undefined}
                    onChange={(e) => {
                        if (hasSelection) return;
                        setQuery(e.target.value);
                        if (e.target.value.length > 0) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (!hasSelection) setIsOpen(true);
                    }}
                    onKeyDown={(event) => {
                        if (hasSelection && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            handleSelectedFieldActivate();
                            return;
                        }
                        handleKeyDown(event);
                    }}
                    placeholder="Search city, area or district..."
                    disabled={disabled}
                    aria-label={hasSelection
                        ? `Selected location ${selectedLabel}. Activate to change location.`
                        : "Search city, area or district"}
                    title={hasSelection ? "Tap to change location" : undefined}
                    className={cn(
                        "pl-10 h-11 rounded-xl transition-all text-body-lg md:text-body truncate",
                        hasSelection ? "pr-18 sm:pr-20 bg-primary/5 font-semibold text-primary border-primary/20 cursor-pointer" : "pr-28 sm:pr-32 bg-background cursor-text",
                        error ? "border-destructive ring-destructive/50" : "",
                        className
                    )}
                    onClick={handleSelectedFieldActivate}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5">
                    {(isSearching || isDetecting) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {hasSelection && !disabled ? (
                        <button type="button" onClick={handleClear} className="flex items-center justify-center h-7 px-2 rounded-lg bg-muted/60 hover:bg-muted text-tiny font-semibold text-muted-foreground hover:text-foreground transition-colors" title="Change location">
                            Change
                        </button>
                    ) : !disabled ? (
                        <button
                            type="button"
                            disabled={isDetecting}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDetect();
                            }}
                            className="flex items-center gap-1 h-7 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-tiny font-semibold transition-colors"
                            title="Use Current Location"
                            aria-label="Use Current Location"
                        >
                            <Target className={cn("w-3.5 h-3.5 shrink-0", isDetecting && "animate-spin")} />
                            <span className="hidden xs:inline sm:inline text-tiny font-semibold">Auto Detect</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {isOpen && !hasSelection && !disabled && (
                <div ref={dropdownRef} className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-[min(280px,calc(var(--visual-viewport-height,100dvh)-12rem))] bg-popover border rounded-xl shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {detectFeedback && !isDetecting && (
                        <div className="px-3 py-1.5 bg-destructive/5 border-b border-destructive/10">
                            <p className="text-tiny font-medium text-destructive">{detectFeedback}</p>
                        </div>
                    )}
                    {children}
                </div>
            )}
        </div>
    );
}
