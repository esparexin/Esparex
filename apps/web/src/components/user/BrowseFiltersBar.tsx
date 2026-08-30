"use client";

import { memo, useState } from "react";
import { Search, SlidersHorizontal, Check } from "@/icons/IconRegistry";
import type { Category } from "@/lib/api/user/categories";
import { Button, Drawer } from "@esparex/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface BrowseFiltersHeaderTriggerProps {
  inputId?: string;
  inputValue: string;
  selectedCategory: string;
  categories: Category[];
  searchAriaLabel: string;
  searchPlaceholder: string;
  onInputChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
  getCategoryValue?: (category: Category) => string;
  activeFilterCount?: number;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min?: number, max?: number) => void;
  deviceCondition?: string;
  onDeviceConditionChange?: (condition: string) => void;
}

type FilterTab = "category" | "budget" | "condition";

export const BrowseFiltersHeaderTrigger = memo(function BrowseFiltersHeaderTrigger({
  inputId,
  inputValue,
  selectedCategory,
  categories,
  searchAriaLabel,
  searchPlaceholder,
  onInputChange,
  onCategoryChange,
  onReset,
  getCategoryValue = (category) => category.slug || category.id,
  activeFilterCount = 0,
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
      onPriceChange(
        localMin ? Number.parseInt(localMin, 10) : undefined,
        localMax ? Number.parseInt(localMax, 10) : undefined
      );
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
      title="FILTERS & SORT"
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
      <div className="flex flex-col h-[75dvh] max-h-[560px] -mx-4 -mb-4">
        {/* Search Bar Header */}
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id={inputId}
              aria-label={searchAriaLabel}
              placeholder={searchPlaceholder}
              className="pl-9 h-9 text-body-lg md:text-body rounded-xl bg-background border-input"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
            />
          </div>
        </div>

        {/* 2-Panel Layout: Left Tabs + Right Options */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Vertical Navigation Tabs */}
          <div className="w-[125px] shrink-0 bg-muted/50 border-r border-border overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveTab("category")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-small font-semibold border-l-4 transition-colors",
                activeTab === "category"
                  ? "bg-card text-foreground border-primary font-bold shadow-xs"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              By Category
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("budget")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-small font-semibold border-l-4 transition-colors",
                activeTab === "budget"
                  ? "bg-card text-foreground border-primary font-bold shadow-xs"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              By Budget
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("condition")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-small font-semibold border-l-4 transition-colors",
                activeTab === "condition"
                  ? "bg-card text-foreground border-primary font-bold shadow-xs"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              Condition
            </button>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-4 overflow-y-auto bg-card">
            {activeTab === "category" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onCategoryChange("all")}
                  className={cn(
                    "flex w-full items-center justify-between p-2.5 rounded-lg text-small font-medium transition-colors",
                    !selectedCategory || selectedCategory === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground-secondary hover:bg-muted"
                  )}
                >
                  <span>All Categories</span>
                  {(!selectedCategory || selectedCategory === "all") && (
                    <Check className="size-4 shrink-0" />
                  )}
                </button>

                {categories.map((cat) => {
                  const val = getCategoryValue(cat);
                  const isSelected = selectedCategory === val || selectedCategory === cat.slug || selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onCategoryChange(val)}
                      className={cn(
                        "flex w-full items-center justify-between p-2.5 rounded-lg text-small font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground-secondary hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <Check className="size-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "budget" && (
              <div className="space-y-4">
                <Label className="text-caption font-bold text-foreground-subtle uppercase tracking-wider">
                  Price Range (₹)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    className="h-9 text-body-lg md:text-body rounded-xl border-input"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    className="h-9 text-body-lg md:text-body rounded-xl border-input"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <Label className="text-tiny font-semibold text-muted-foreground">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Under ₹5,000", min: "", max: "5000" },
                      { label: "₹5k - ₹15k", min: "5000", max: "15000" },
                      { label: "₹15k - ₹30k", min: "15000", max: "30000" },
                      { label: "Above ₹30k", min: "30000", max: "" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setLocalMin(preset.min);
                          setLocalMax(preset.max);
                        }}
                        className="px-3 py-1.5 rounded-full border border-border text-tiny font-medium text-foreground-secondary hover:border-primary hover:bg-muted transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "condition" && (
              <div className="space-y-3">
                <Label className="text-caption font-bold text-foreground-subtle uppercase tracking-wider">
                  Device Condition
                </Label>
                <div className="space-y-2">
                  {[
                    { id: "power_on", label: "Powers On (Working)" },
                    { id: "power_off", label: "Powers Off (Parts / Repair)" },
                  ].map((item) => {
                    const isChecked = deviceCondition === item.id;
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted">
                        <Checkbox
                          id={`drawer-cond-${item.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            onDeviceConditionChange?.(checked ? item.id : "");
                          }}
                        />
                        <Label
                          htmlFor={`drawer-cond-${item.id}`}
                          className="text-small font-medium text-foreground-secondary cursor-pointer flex-1"
                        >
                          {item.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Footer (Protected from Floating Elements) */}
        <div className="p-3 bg-card border-t border-border flex items-center gap-3 pb-8 sm:pb-3">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1 h-10 text-small font-semibold rounded-xl border-border text-foreground-secondary"
          >
            Clear all
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
