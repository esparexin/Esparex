"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useIsMobile } from "@/components/ui/useMobile";
import type { Category } from "@/lib/api/user/categories";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { MobileStickyCTA } from "@/components/ui/mobile-sticky-cta";
import { haptics } from "@/lib/haptics";
import {
    SearchFiltersPanel,
    type SearchFiltersPanelSharedProps,
} from "@/components/search/SearchFiltersPanel";

const searchFiltersDesktopShellClassName =
    "w-72 shrink-0 border border-slate-100 rounded-2xl bg-white p-5 h-fit sticky top-[6.25rem] shadow-sm";

export type SearchFiltersShellProps = SearchFiltersPanelSharedProps & {
    setSelectedCategory: (val: string | null) => void;
    categories: Category[];
    activeFilterCount?: number;
    desktopShellClassName?: string;
};

function SearchFiltersDesktopShell({
    children,
    className = searchFiltersDesktopShellClassName
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <aside
            role="region"
            aria-label="Search Filters"
            className={className}
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-slate-900">Filters</h3>
                <SlidersHorizontal className="size-4 text-slate-400" />
            </div>
            {children}
        </aside>
    );
}

export function SearchFiltersShell({
    selectedCategory,
    setSelectedCategory: _setSelectedCategory,
    priceRange,
    setPriceRange,
    selectedBrands,
    setSelectedBrands,
    categories: _categories,
    availableBrands,
    categoryFilters,
    setCategoryFilters,
    radiusKm = 50,
    setRadiusKm,
    dynamicSpecificFilters = [],
    onApply,
    onReset,
    activeFilterCount = 0,
    desktopShellClassName,
}: SearchFiltersShellProps) {
    const isMobile = useIsMobile();
    const [isHydrated, setIsHydrated] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const panelProps = {
        selectedCategory,
        priceRange,
        setPriceRange,
        selectedBrands,
        setSelectedBrands,
        availableBrands,
        categoryFilters,
        setCategoryFilters,
        radiusKm,
        setRadiusKm,
        dynamicSpecificFilters
    };

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return (
        <>
            {!isHydrated ? (
                <SearchFiltersDesktopShell className={`hidden lg:block ${desktopShellClassName ?? searchFiltersDesktopShellClassName}`}>
                    <div className="space-y-3">
                        <div className="h-40 rounded-xl bg-slate-50" />
                        <div className="h-32 rounded-xl bg-slate-50" />
                        <div className="h-32 rounded-xl bg-slate-50" />
                    </div>
                </SearchFiltersDesktopShell>
            ) : isMobile ? (
                <div className="lg:hidden w-full flex-1" role="region" aria-label="Search Filters">
                    <Drawer
                        title="Filter Products"
                        open={mobileDrawerOpen}
                        onOpenChange={setMobileDrawerOpen}
                        trigger={
                            <Button variant="outline" className="h-11 px-4 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold text-sm rounded-full shadow-none">
                                <SlidersHorizontal className="size-4 text-slate-500" />
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        }
                    >
                        <div className="pb-10 pt-2 h-full">
                            {mobileDrawerOpen && (
                                <SearchFiltersPanel
                                    {...panelProps}
                                    onApply={() => {
                                        haptics.tap();
                                        onApply?.();
                                    }}
                                    onReset={() => {
                                        haptics.impact();
                                        onReset();
                                    }}
                                />
                            )}
                        </div>
                        {onApply && (
                            <MobileStickyCTA
                                label="Apply Filters"
                                onClick={() => {
                                    haptics.tap();
                                    onApply();
                                }}
                            />
                        )}
                    </Drawer>
                </div>
            ) : (
                <SearchFiltersDesktopShell className={desktopShellClassName ?? searchFiltersDesktopShellClassName}>
                    <SearchFiltersPanel
                        {...panelProps}
                        onApply={onApply}
                        onReset={onReset}
                    />
                </SearchFiltersDesktopShell>
            )}
        </>
    );
}
