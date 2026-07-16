"use client";

import { useState, useRef, useLayoutEffect, type CSSProperties, type ReactNode } from "react";
import { Search, Loader2, Minus } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Z_INDEX } from "@/lib/zIndexConfig";

export interface AsyncSearchSelectProps {
    search: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    isLoading?: boolean;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    selectedName: string;
    onClear: () => void;
    dropdownContent: ReactNode;
    className?: string;
    autoFocus?: boolean;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    errorText?: string | null;
}

export function AsyncSearchSelect({
    search,
    onSearchChange,
    placeholder,
    disabled = false,
    isLoading = false,
    isEditing,
    setIsEditing,
    selectedName,
    onClear,
    dropdownContent,
    className,
    autoFocus,
    onKeyDown,
    onFocus,
    errorText,
}: AsyncSearchSelectProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);

    // Fixed-position dropdown positioning logic
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container || (!isEditing && !search)) {
            setDropdownStyle(null);
            return undefined;
        }

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

    // ── Selected State (Inline Trailing Action: Minus) ─────────────────────
    if (selectedName && !isEditing) {
        return (
            <div className={cn("relative", className)} ref={containerRef}>
                <div className="relative group">
                    <Input
                        value={selectedName}
                        readOnly
                        disabled={disabled}
                        className="pl-4 pr-12 h-12 text-sm font-medium border-slate-200/80 rounded-xl transition-all shadow-sm bg-slate-50 text-foreground cursor-pointer"
                        onClick={() => {
                            if (!disabled) {
                                setIsEditing(true);
                                onSearchChange(selectedName);
                            }
                        }}
                    />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClear();
                            }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:text-primary transition-all"
                            aria-label="Remove selection"
                            title="Remove selection"
                        >
                            <Minus className="w-[18px] h-[18px]" />
                        </button>
                    )}
                </div>
            </div>
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
                    autoFocus={autoFocus || isEditing}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={() => {
                        setIsEditing(true);
                        onFocus?.();
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "pl-10 h-12 text-sm font-medium border-slate-200/80 rounded-xl transition-all",
                        "focus-visible:ring-2 focus-visible:ring-primary/10 focus-visible:border-primary shadow-sm",
                        "pr-4"
                    )}
                />
            </div>
            {errorText ? (
                <p className="mt-1 px-1 text-xs font-semibold text-amber-700">
                    {errorText}
                </p>
            ) : null}

            {(isEditing || search) && dropdownStyle && (
                <>
                    <div
                        style={{ zIndex: Z_INDEX.brandSearchBackdrop }}
                        className="fixed inset-0"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            setIsEditing(false);
                            onSearchChange("");
                        }}
                    />
                    <div
                        style={{ ...dropdownStyle, zIndex: Z_INDEX.selectContent }}
                        className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        {dropdownContent}
                    </div>
                </>
            )}
        </div>
    );
}
