"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronRight, RotateCcw } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/user/categories";

export interface BrowseFilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categorySlugOrId: string) => void;
  brandId?: string;
  onBrandChange?: (brandId: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min?: number, max?: number) => void;
  sellerType?: "all" | "user" | "business";
  onSellerTypeChange?: (sellerType: "all" | "user" | "business") => void;
  deviceCondition?: string;
  onDeviceConditionChange?: (condition: string) => void;
  onReset: () => void;
  activeFilterCount?: number;
  className?: string;
}

const SELLER_OPTIONS = [
  { id: "all", label: "All Sellers" },
  { id: "user", label: "Individual Users" },
  { id: "business", label: "Verified Businesses" },
] as const;

const CONDITION_OPTIONS = [
  { id: "power_on", label: "Powers On (Working)" },
  { id: "power_off", label: "Powers Off (Parts / Repair)" },
] as const;

export function BrowseFilterSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  sellerType = "all",
  onSellerTypeChange,
  deviceCondition,
  onDeviceConditionChange,
  minPrice,
  maxPrice,
  onPriceChange,
  onReset,
  activeFilterCount = 0,
  className,
}: BrowseFilterSidebarProps) {
  const [minInput, setMinInput] = useState<string>(minPrice ? String(minPrice) : "");
  const [maxInput, setMaxInput] = useState<string>(maxPrice ? String(maxPrice) : "");
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  const [sellerTypeExpanded, setSellerTypeExpanded] = useState(true);
  const [conditionExpanded, setConditionExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);

  const handleApplyPrice = () => {
    const min = minInput ? Number.parseInt(minInput, 10) : undefined;
    const max = maxInput ? Number.parseInt(maxInput, 10) : undefined;
    if (onPriceChange) {
      onPriceChange(min, max);
    }
  };

  return (
    <div
      role="region"
      aria-label="Filter listings"
      className={cn("w-[260px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-5", className)}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-foreground-secondary" />
          <h2 className="text-h4 font-bold text-foreground tracking-tight">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-caption font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-caption font-semibold text-foreground-subtle hover:text-destructive px-2 gap-1">
            <RotateCcw className="size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* 1. Category Tree Section */}
      <div className="space-y-2 border-b border-border/60 pb-4">
        <button
          type="button"
          aria-expanded={categoryExpanded}
          aria-controls="filter-categories-section"
          onClick={() => setCategoryExpanded(!categoryExpanded)}
          className="flex w-full items-center justify-between text-caption font-bold uppercase tracking-wider text-foreground-subtle hover:text-foreground transition-colors"
        >
          <span>Categories</span>
          <ChevronDown className={cn("size-4 transition-transform", !categoryExpanded && "-rotate-90")} />
        </button>

        {categoryExpanded && (
          <nav id="filter-categories-section" aria-label="Category Tree Navigation" className="pt-1 space-y-1">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-small font-medium transition-colors",
                !selectedCategory || selectedCategory === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground-secondary hover:bg-muted hover:text-foreground"
              )}
            >
              <span>All Categories</span>
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.slug || cat.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-small font-medium transition-colors pl-4",
                    isSelected ? "bg-primary text-primary-foreground font-semibold" : "text-foreground-secondary hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <ChevronRight className="size-3 shrink-0" />}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* 2. Price Range Section */}
      <div className="space-y-3 border-b border-border/60 pb-4">
        <button
          type="button"
          aria-expanded={priceExpanded}
          aria-controls="filter-price-section"
          onClick={() => setPriceExpanded(!priceExpanded)}
          className="flex w-full items-center justify-between text-caption font-bold uppercase tracking-wider text-foreground-subtle hover:text-foreground transition-colors"
        >
          <span>Price Range (₹)</span>
          <ChevronDown className={cn("size-4 transition-transform", !priceExpanded && "-rotate-90")} />
        </button>

        {priceExpanded && (
          <div id="filter-price-section" className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="sidebar-min-price" className="text-tiny text-foreground-subtle font-medium">Min</Label>
                <Input
                  id="sidebar-min-price"
                  type="number"
                  placeholder="₹ Min"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  className="h-9 text-small rounded-lg border-border"
                />
              </div>
              <span className="text-foreground-subtle pt-4">-</span>
              <div className="space-y-1 flex-1">
                <Label htmlFor="sidebar-max-price" className="text-tiny text-foreground-subtle font-medium">Max</Label>
                <Input
                  id="sidebar-max-price"
                  type="number"
                  placeholder="₹ Max"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  className="h-9 text-small rounded-lg border-border"
                />
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleApplyPrice} className="w-full h-9 text-small font-semibold rounded-lg border-border bg-muted hover:bg-muted/80 min-h-[36px]">
              Apply Price
            </Button>
          </div>
        )}
      </div>

      {/* 3. Seller Type Section */}
      <div className="space-y-3 border-b border-border/60 pb-4">
        <button
          type="button"
          aria-expanded={sellerTypeExpanded}
          aria-controls="filter-seller-section"
          onClick={() => setSellerTypeExpanded(!sellerTypeExpanded)}
          className="flex w-full items-center justify-between text-caption font-bold uppercase tracking-wider text-foreground-subtle hover:text-foreground transition-colors"
        >
          <span>Seller Type</span>
          <ChevronDown className={cn("size-4 transition-transform", !sellerTypeExpanded && "-rotate-90")} />
        </button>

        {sellerTypeExpanded && (
          <div id="filter-seller-section" className="space-y-2 pt-1">
            {SELLER_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-2.5 text-small text-foreground-secondary font-medium cursor-pointer hover:text-foreground min-h-[36px]">
                <input
                  type="radio"
                  name="sellerType"
                  value={option.id}
                  checked={sellerType === option.id}
                  onChange={() => onSellerTypeChange?.(option.id as "all" | "user" | "business")}
                  className="size-4 text-primary border-border focus:ring-ring"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Condition Section */}
      <div className="space-y-3">
        <button
          type="button"
          aria-expanded={conditionExpanded}
          aria-controls="filter-condition-section"
          onClick={() => setConditionExpanded(!conditionExpanded)}
          className="flex w-full items-center justify-between text-caption font-bold uppercase tracking-wider text-foreground-subtle hover:text-foreground transition-colors"
        >
          <span>Condition</span>
          <ChevronDown className={cn("size-4 transition-transform", !conditionExpanded && "-rotate-90")} />
        </button>

        {conditionExpanded && (
          <div id="filter-condition-section" className="space-y-2 pt-1">
            {CONDITION_OPTIONS.map((cond) => {
              const isChecked = deviceCondition === cond.id;
              return (
                <div key={cond.id} className="flex items-center gap-2.5 min-h-[36px]">
                  <Checkbox
                    id={`sidebar-cond-${cond.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      onDeviceConditionChange?.(checked ? cond.id : "");
                    }}
                  />
                  <Label htmlFor={`sidebar-cond-${cond.id}`} className="text-small font-medium text-foreground-secondary cursor-pointer hover:text-foreground">
                    {cond.label}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
