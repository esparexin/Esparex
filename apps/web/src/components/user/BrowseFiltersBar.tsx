"use client";

import { memo, useState } from "react";
import { SlidersHorizontal } from "@esparex/ui";
import type { Category } from "@/lib/api/user/categories";
import { Button, Drawer } from "@esparex/ui";
import { cn } from "@/lib/utils";
import type { PublicBrowseType } from "@/lib/publicBrowseRoutes";
import { BrowseFiltersDrawerPanels, type FilterTab } from "./BrowseFiltersDrawerPanels";

export interface BrowseFiltersHeaderTriggerProps {
  inputId?: string;
  inputValue?: string;
  selectedCategory: string;
  categories: Category[];
  searchAriaLabel?: string;
  searchPlaceholder?: string;
  onInputChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
  getCategoryValue?: (category: Category) => string;
  activeFilterCount?: number;
  browseType?: PublicBrowseType;
  onTypeChange?: (type: PublicBrowseType) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min?: number, max?: number) => void;
  deviceCondition?: string;
  onDeviceConditionChange?: (condition: string) => void;
}

export const BrowseFiltersHeaderTrigger = memo(function BrowseFiltersHeaderTrigger({
  inputId: _inputId,
  inputValue: _inputValue,
  selectedCategory,
  categories,
  searchAriaLabel: _searchAriaLabel,
  searchPlaceholder: _searchPlaceholder,
  onInputChange: _onInputChange,
  onCategoryChange,
  onReset,
  getCategoryValue = (category) => category.slug || category.id,
  activeFilterCount = 0,
  browseType,
  onTypeChange,
  minPrice,
  maxPrice,
  onPriceChange,
  deviceCondition,
  onDeviceConditionChange,
}: BrowseFiltersHeaderTriggerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("category");

  const [localMin, setLocalMin] = useState<string>(minPrice ? String(minPrice) : "");
  const [localMax, setLocalMax] = useState<string>(maxPrice ? String(maxPrice) : "");

  const handleApply = () => {
    if (onPriceChange && (localMin || localMax)) {
      const min = localMin ? Number(localMin) : undefined;
      const max = localMax ? Number(localMax) : undefined;
      onPriceChange(min, max);
    }
    setOpen(false);
  };

  const handleClearAll = () => {
    setLocalMin("");
    setLocalMax("");
    onReset();
    setOpen(false);
  };

  return (
    <Drawer
      title="Filters"
      titleClassName="text-body-lg font-semibold tracking-tight text-foreground"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          variant="outline"
          onClick={(e) => e.currentTarget.blur()}
          aria-label="Open search filters"
          className="lg:hidden h-9 px-3 gap-1.5 text-foreground-secondary border-border hover:bg-muted font-normal text-caption rounded-full shadow-none"
        >
          <SlidersHorizontal className="size-4 text-foreground-tertiary" />
          <span className="hidden sm:inline font-normal">Filters</span>
          {activeFilterCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-caption font-bold leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      }
    >
      <div className="flex flex-col h-[min(380px,calc(var(--visual-viewport-height,100dvh)-5rem))] max-h-[calc(var(--visual-viewport-height,100dvh)-2rem)] -mx-4 -mb-4">
        {/* 2-Panel Layout: Left Tabs + Right Options */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Vertical Navigation Tabs */}
          <div className="w-[115px] shrink-0 bg-muted/50 border-r border-border overflow-y-auto">
            {onTypeChange && (
              <button
                type="button"
                onClick={() => setActiveTab("type")}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-caption font-semibold border-l-4 transition-colors min-h-[40px]",
                  activeTab === "type"
                    ? "bg-card text-foreground border-primary font-bold shadow-xs"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                Listing Type
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("category")}
              className={cn(
                "w-full text-left px-3 py-2.5 text-caption font-semibold border-l-4 transition-colors min-h-[40px]",
                activeTab === "category"
                  ? "bg-card text-foreground border-primary font-bold shadow-xs"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              Category
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("budget")}
              className={cn(
                "w-full text-left px-3 py-2.5 text-caption font-semibold border-l-4 transition-colors min-h-[40px]",
                activeTab === "budget"
                  ? "bg-card text-foreground border-primary font-bold shadow-xs"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              Budget
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("condition")}
              className={cn(
                "w-full text-left px-3 py-2.5 text-caption font-semibold border-l-4 transition-colors min-h-[40px]",
                activeTab === "condition"
                  ? "bg-card text-foreground border-primary font-bold shadow-xs"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              Condition
            </button>
          </div>

          {/* Right Content Panel */}
          <BrowseFiltersDrawerPanels
            activeTab={activeTab}
            browseType={browseType}
            onTypeChange={onTypeChange}
            onClose={() => setOpen(false)}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            getCategoryValue={getCategoryValue}
            localMin={localMin}
            setLocalMin={setLocalMin}
            localMax={localMax}
            setLocalMax={setLocalMax}
            deviceCondition={deviceCondition}
            onDeviceConditionChange={onDeviceConditionChange}
          />
        </div>

        {/* Sticky Bottom Action Footer (Protected from Floating Elements) */}
        <div className="p-3 bg-card border-t border-border flex items-center gap-3 pb-5 sm:pb-3">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1 h-10 text-small font-semibold rounded-xl border-border text-foreground-secondary"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 h-10 text-small font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </Drawer>
  );
});
