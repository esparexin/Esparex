"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useIsMobile } from "@/components/ui/useMobile";
import type { Category } from "@/api/user/categories";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { MobileStickyCTA } from "@/components/ui/mobile-sticky-cta";
import { haptics } from "@/utils/haptics";
import { SearchFiltersPanel, type SpecificFilter } from "@/components/search/SearchFiltersPanel";

export type SearchFiltersShellProps = {
    selectedCategory: string | null;
    setSelectedCategory: (val: string | null) => void;
    priceRange: [number, number];
    setPriceRange: (val: [number, number]) => void;
    selectedBrands: string[];
    setSelectedBrands: (val: string[]) => void;
    categories: Category[];
    availableBrands: string[];
    categoryFilters: Record<string, string[]>;
    setCategoryFilters: (val: Record<string, string[]>) => void;
    radiusKm: number;
    setRadiusKm: (val: number) => void;
    dynamicSpecificFilters?: SpecificFilter[];
    onApply?: () => void;
    onReset: () => void;
};

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

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return (
        <>
            {!isHydrated ? (
                <aside
                    role="region"
                    aria-label="Search Filters"
                    className="hidden lg:block w-72 shrink-0 border border-slate-100 rounded-2xl bg-white p-5 h-fit sticky top-24 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Filters</h3>
                        <SlidersHorizontal className="size-4 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-40 rounded-xl bg-slate-50" />
                        <div className="h-32 rounded-xl bg-slate-50" />
                        <div className="h-32 rounded-xl bg-slate-50" />
                    </div>
                </aside>
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
                                    selectedCategory={selectedCategory}
                                    priceRange={priceRange}
                                    setPriceRange={setPriceRange}
                                    selectedBrands={selectedBrands}
                                    setSelectedBrands={setSelectedBrands}
                                    availableBrands={availableBrands}
                                    categoryFilters={categoryFilters}
                                    setCategoryFilters={setCategoryFilters}
                                    radiusKm={radiusKm}
                                    setRadiusKm={setRadiusKm}
                                    dynamicSpecificFilters={dynamicSpecificFilters}
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
                <aside
                    role="region"
                    aria-label="Search Filters"
                    className="w-72 shrink-0 border border-slate-100 rounded-2xl bg-white p-5 h-fit sticky top-24 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Filters</h3>
                        <SlidersHorizontal className="size-4 text-slate-400" />
                    </div>
                    <SearchFiltersPanel
                        selectedCategory={selectedCategory}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        selectedBrands={selectedBrands}
                        setSelectedBrands={setSelectedBrands}
                        availableBrands={availableBrands}
                        categoryFilters={categoryFilters}
                        setCategoryFilters={setCategoryFilters}
                        radiusKm={radiusKm}
                        setRadiusKm={setRadiusKm}
                        dynamicSpecificFilters={dynamicSpecificFilters}
                        onApply={onApply}
                        onReset={onReset}
                    />
                </aside>
            )}
        </>
    );
}
