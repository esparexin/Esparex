"use client";

import { useState, useRef, useLayoutEffect, useMemo, type CSSProperties } from "react";
import { Check, Search } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";

interface BrandSearchSelectProps {
    brands: string[];
    brandMap: Record<string, { id?: string } | undefined>;
    /** Currently selected brandId */
    value: string;
    /** Called with (brandId, brandName) on selection */
    onChange: (brandId: string, brandName: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function BrandSearchSelect({
    brands,
    brandMap,
    value,
    onChange,
    disabled = false,
    placeholder = "Search brand...",
    className,
}: BrandSearchSelectProps) {
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);

    // Resolve selected brand name from value (brandId)
    const selectedName = useMemo(() => {
        return brands.find((b) => {
            const id = brandMap[b]?.id ?? b;
            return id === value;
        }) ?? "";
    }, [brands, brandMap, value]);

    // Fixed-position dropdown using useLayoutEffect to avoid layout-push flash
    useLayoutEffect(() => {
        if (!search) {
            setDropdownStyle(null);
            return;
        }
        const container = containerRef.current;
        if (!container) { setDropdownStyle(null); return; }

        const calculate = () => {
            const rect = container.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropdownStyle({
                position: "fixed",
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                maxHeight: Math.min(240, Math.max(spaceBelow - 8, 80)),
            });
        };

        calculate();
        window.addEventListener("scroll", calculate, true);
        window.addEventListener("resize", calculate);
        return () => {
            window.removeEventListener("scroll", calculate, true);
            window.removeEventListener("resize", calculate);
        };
    }, [search]);

    // Clear search when selection changes
    useLayoutEffect(() => {
        if (selectedName) setSearch("");
    }, [selectedName]);

    const filtered = useMemo(
        () =>
            search
                ? brands.filter((b) => b.toLowerCase().includes(search.toLowerCase()))
                : brands,
        [brands, search]
    );

    const handleSelect = (brandName: string) => {
        const id = brandMap[brandName]?.id ?? brandName;
        onChange(id, brandName);
        setSearch("");
        setIsEditing(false);
    };

    // ── Selected state ──────────────────────────────────────────────────────
    if (selectedName && !isEditing) {
        return (
            <div className={cn(
                "flex items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50/50 px-3 h-11",
                className
            )}>
                <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm truncate">{selectedName}</span>
                </div>
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-primary hover:underline shrink-0 ml-2"
                    >
                        Edit
                    </button>
                )}
            </div>
        );
    }

    // ── Search state ────────────────────────────────────────────────────────
    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium placeholder:text-slate-400 focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Dropdown — only shown once fixed position is calculated */}
            {search && dropdownStyle && (
                <>
                    <div
                        className="fixed inset-0 z-[9998]"
                        onPointerDown={() => setSearch("")}
                    />
                    <div
                        style={{ ...dropdownStyle, zIndex: 9999, position: "fixed" }}
                        className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto"
                    >
                        {filtered.length === 0 ? (
                            <div className="py-4 px-4 text-center text-sm text-slate-400">
                                No brands found for &ldquo;{search}&rdquo;
                            </div>
                        ) : (
                            filtered.slice(0, 10).map((b) => (
                                <button
                                    key={b}
                                    type="button"
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(b);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                >
                                    {b}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
