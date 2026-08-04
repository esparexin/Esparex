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
  sellerType?: "all" | "user" | "business";
  onSellerTypeChange?: (sellerType: "all" | "user" | "business") => void;
  deviceCondition?: string;
  onDeviceConditionChange?: (condition: string) => void;
}

type FilterTab = "category" | "budget" | "seller" | "condition";

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
  sellerType = "all",
  onSellerTypeChange,
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
          className="lg:hidden h-10 px-3.5 gap-1.5 text-slate-800 border-slate-200 hover:bg-slate-50 font-normal text-xs rounded-full shadow-none"
        >
          <SlidersHorizontal className="size-4 text-slate-600" />
          <span className="hidden sm:inline font-normal">Filters</span>
          {activeFilterCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      }
    >
      <div className="flex flex-col h-[75dvh] max-h-[560px] -mx-4 -mb-4">
        {/* Search Bar Header */}
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              id={inputId}
              aria-label={searchAriaLabel}
              placeholder={searchPlaceholder}
              className="pl-9 h-10 text-xs rounded-xl bg-slate-50 border-slate-200"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
            />
          </div>
        </div>

        {/* 2-Panel Layout: Left Tabs + Right Options */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Vertical Navigation Tabs */}
          <div className="w-[125px] shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveTab("category")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-xs font-semibold border-l-4 transition-colors",
                activeTab === "category"
                  ? "bg-white text-slate-900 border-slate-900 font-bold shadow-sm"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              )}
            >
              By Category
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("budget")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-xs font-semibold border-l-4 transition-colors",
                activeTab === "budget"
                  ? "bg-white text-slate-900 border-slate-900 font-bold shadow-sm"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              )}
            >
              By Budget
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("seller")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-xs font-semibold border-l-4 transition-colors",
                activeTab === "seller"
                  ? "bg-white text-slate-900 border-slate-900 font-bold shadow-sm"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              )}
            >
              By Seller
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("condition")}
              className={cn(
                "w-full text-left px-3 py-3.5 text-xs font-semibold border-l-4 transition-colors",
                activeTab === "condition"
                  ? "bg-white text-slate-900 border-slate-900 font-bold shadow-sm"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              )}
            >
              Condition
            </button>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-4 overflow-y-auto bg-white">
            {activeTab === "category" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onCategoryChange("all")}
                  className={cn(
                    "flex w-full items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors",
                    !selectedCategory || selectedCategory === "all"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
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
                        "flex w-full items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
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
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Price Range (₹)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    className="h-10 text-xs rounded-xl border-slate-200"
                  />
                  <span className="text-slate-300">-</span>
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    className="h-10 text-xs rounded-xl border-slate-200"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-500">Quick Presets</Label>
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
                        className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "seller" && (
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Seller Type
                </Label>
                <div className="space-y-2">
                  {[
                    { id: "all", label: "All Sellers" },
                    { id: "user", label: "Individual Users" },
                    { id: "business", label: "Verified Businesses" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="mobileSellerType"
                        value={item.id}
                        checked={sellerType === item.id}
                        onChange={() => onSellerTypeChange?.(item.id as "all" | "user" | "business")}
                        className="size-4 text-slate-900 border-slate-300 focus:ring-slate-400"
                      />
                      <span className="text-xs font-medium text-slate-800">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "condition" && (
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Device Condition
                </Label>
                <div className="space-y-2">
                  {[
                    { id: "power_on", label: "Powers On (Working)" },
                    { id: "power_off", label: "Powers Off (Parts / Repair)" },
                  ].map((item) => {
                    const isChecked = deviceCondition === item.id;
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                        <Checkbox
                          id={`drawer-cond-${item.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            onDeviceConditionChange?.(checked ? item.id : "");
                          }}
                        />
                        <Label
                          htmlFor={`drawer-cond-${item.id}`}
                          className="text-xs font-medium text-slate-800 cursor-pointer flex-1"
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
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-3 pb-8 sm:pb-3">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1 h-11 text-xs font-semibold rounded-xl border-slate-200 text-slate-700"
          >
            Clear all
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 h-11 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </Drawer>
  );
});
