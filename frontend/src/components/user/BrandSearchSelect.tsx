"use client";

import { useState, useRef, useLayoutEffect, useMemo, type CSSProperties } from "react";
import { Check, Search } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Z_INDEX } from "@/lib/zIndexConfig";

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

    // value is always the brand *display name* (same as ModelSearchSelect pattern).
    // For brands in the catalog, brandMap[name].id gives the ObjectId.
    // For custom brands typed by the user, value is the name and brandId will be empty.
    const selectedName = value ?? "";

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
                "flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3",
                className
            )}>
                <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <span className="truncate text-sm font-semibold text-foreground">{selectedName}</span>
                </div>
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="ml-2 shrink-0 text-xs font-semibold text-primary hover:underline"
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-9 pr-4"
                />
            </div>

            {/* Dropdown — only shown once fixed position is calculated */}
            {search && dropdownStyle && (
                <>
                    <div
                        style={{ zIndex: Z_INDEX.brandSearchBackdrop }}
                        className="fixed inset-0"
                        onPointerDown={() => setSearch("")}
                    />
                    <div
                        style={{ ...dropdownStyle, zIndex: Z_INDEX.selectContent, position: "fixed" }}
                        className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-y-auto"
                    >
                        {filtered.length === 0 ? (
                            <div className="py-8 px-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                                    <Search className="w-5 h-5 text-slate-300" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 mb-1">
                                    Brand Not Found
                                </h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6 max-w-[200px]">
                                    We couldn&apos;t find &ldquo;{search}&rdquo; in our catalog.
                                </p>
                                
                                {search.trim().length >= 2 && (
                                    <button
                                        type="button"
                                        onPointerDown={(e) => {
                                            e.preventDefault();
                                            onChange("", search.trim());
                                            setSearch("");
                                            setIsEditing(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.97] shadow-md shadow-primary/20"
                                    >
                                        <span className="text-lg leading-none">+</span>
                                        Use &ldquo;{search.trim()}&rdquo;
                                    </button>
                                )}
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
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-foreground-secondary transition-colors hover:bg-slate-50 active:bg-slate-100"
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
