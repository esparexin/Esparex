"use client";

import { useState, useRef, useLayoutEffect, useMemo, type CSSProperties } from "react";
import { Search, Minus } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Z_INDEX } from "@/lib/zIndexConfig";
import { Drawer } from "@/components/ui/drawer";
import { useIsMobile } from "@/components/ui/useMobile";


interface BrandSearchSelectProps {
    brands: string[];
    brandMap: Record<string, { id?: string } | undefined>;
    /** Currently selected brand display name. */
    value: string;
    /** Called with (brandId, brandName, requestId) on selection */
    onChange: (brandId: string, brandName: string, requestId?: string) => void;
    categoryId: string;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function BrandSearchSelect({
    brands,
    brandMap,
    value,
    onChange,
    categoryId,
    disabled = false,
    placeholder = "Search brand...",
    className,
}: BrandSearchSelectProps) {
    const [search, setSearch] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);
    const isMobile = useIsMobile();

    // value is always the brand *display name* (same as ModelSearchSelect pattern).
    // For brands in the catalog, brandMap[name].id gives the ObjectId.
    // For custom brands typed by the user, value is the name and brandId will be empty.
    const selectedName = value ?? "";

    // Fixed-position dropdown using useLayoutEffect to avoid layout-push flash.
    // Resets dropdownStyle via cleanup when search is cleared.
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
                maxHeight: Math.min(240, Math.max(spaceBelow - 8, 80)),
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
    }, [search]);

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

    const canRequestBrand = Boolean(categoryId);



    // ── Selected state (Inline Trailing Action: Minus) ─────────────────────
    if (selectedName && !isEditing) {
        return (
            <div className={cn("relative", className)} ref={containerRef}>
                <div className="relative">
                    <Input
                        value={selectedName}
                        readOnly
                        disabled={disabled}
                        className="pl-3 pr-10 bg-slate-50 font-medium text-foreground cursor-pointer"
                        onClick={() => {
                            if (!disabled) {
                                setIsEditing(true);
                                setSearch(selectedName);
                            }
                        }}
                    />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange("", "");
                                setSearch("");
                                setIsEditing(false);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:text-primary transition-all"
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

    // ── Search state (Inline Trailing Action: Plus) ────────────────────────
    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn("pl-9", "pr-4")}
                />
            </div>
            {search && !canRequestBrand ? (
                <p className="mt-1 px-1 text-xs font-semibold text-amber-700">
                    Select a category first.
                </p>
            ) : null}

            {/* Dropdown or Drawer */}
            {search && filtered.length > 0 && (
                isMobile ? (
                    <Drawer 
                        title="Select a Brand" 
                        open={true} 
                        onOpenChange={(open) => !open && setSearch("")}
                    >
                        <div className="flex flex-col gap-1 pb-4">
                            {filtered.slice(0, 15).map((b) => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSelect(b);
                                    }}
                                    className="w-full px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-slate-50 active:bg-slate-100 rounded-xl"
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </Drawer>
                ) : (dropdownStyle && (
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
                            {filtered.slice(0, 10).map((b) => (
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
                            ))}
                        </div>
                    </>
                ))
            )}
        </div>
    );
}
