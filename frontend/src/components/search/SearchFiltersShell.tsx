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
    "w-72 shrink-0 border border-slate-100 rounded-2xl bg-white p-5 h-fit sticky top-24 shadow-sm";

export type SearchFiltersShellProps = SearchFiltersPanelSharedProps & {
    setSelectedCategory: (val: string | null) => void;
    categories: Category[];
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
                <h3 className="text-xl font-bold text-slate-900">Filters</h3>
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
    onReset
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
                <SearchFiltersDesktopShell className={`hidden lg:block ${searchFiltersDesktopShellClassName}`}>
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
                            <Button variant="ghost" className="h-10 px-0 gap-2 text-blue-600 hover:text-blue-700 hover:bg-transparent font-medium text-base">
                                <SlidersHorizontal className="size-5" />
                                Filters
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
                <SearchFiltersDesktopShell>
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
