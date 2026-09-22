"use client";

import { Check } from "@esparex/ui";
import type { Category } from "@/lib/api/user/categories";
import { Input, Label, Checkbox } from "@esparex/ui";
import { cn } from "@/lib/utils";
import type { PublicBrowseType } from "@/lib/publicBrowseRoutes";
import { LISTING_TYPE_TABS } from "./ListingTypeTabs";
import { CONDITION_OPTIONS } from "./BrowseFilterSidebar";

export type FilterTab = "type" | "category" | "budget" | "condition";

export interface BrowseFiltersDrawerPanelsProps {
  activeTab: FilterTab;
  browseType?: PublicBrowseType;
  onTypeChange?: (type: PublicBrowseType) => void;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  getCategoryValue: (category: Category) => string;
  localMin: string;
  setLocalMin: (value: string) => void;
  localMax: string;
  setLocalMax: (value: string) => void;
  deviceCondition?: string;
  onDeviceConditionChange?: (condition: string) => void;
}

export function BrowseFiltersDrawerPanels({
  activeTab,
  browseType,
  onTypeChange,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  getCategoryValue,
  localMin,
  setLocalMin,
  localMax,
  setLocalMax,
  deviceCondition,
  onDeviceConditionChange,
}: BrowseFiltersDrawerPanelsProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-card">
      {activeTab === "type" && onTypeChange && (
        <div className="space-y-1.5">
          {LISTING_TYPE_TABS.map((tab) => {
            const isSelected = (browseType ?? "all") === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTypeChange(tab.id);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-caption font-medium transition-colors border min-h-[40px]",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                    : "border-border/80 bg-background text-foreground-secondary hover:bg-muted"
                )}
              >
                <span>{tab.label}</span>
                {isSelected && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "category" && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onCategoryChange("all")}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 rounded-lg text-caption font-medium transition-colors min-h-[36px]",
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
                  "flex w-full items-center justify-between px-3 py-2 rounded-lg text-caption font-medium transition-colors min-h-[36px]",
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
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-caption text-muted-foreground font-medium pointer-events-none">
                ₹
              </span>
              <Input
                type="number"
                placeholder="Min"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="h-9 pl-6 text-body-lg md:text-body placeholder:text-foreground-subtle rounded-xl border-input"
              />
            </div>
            <span className="text-muted-foreground text-caption">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-caption text-muted-foreground font-medium pointer-events-none">
                ₹
              </span>
              <Input
                type="number"
                placeholder="Max"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="h-9 pl-6 text-body-lg md:text-body placeholder:text-foreground-subtle rounded-xl border-input"
              />
            </div>
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
            {CONDITION_OPTIONS.map((item) => {
              const isChecked = deviceCondition === item.id;
              return (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border hover:bg-muted min-h-[38px]">
                  <Checkbox
                    id={`drawer-cond-${item.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      onDeviceConditionChange?.(checked ? item.id : "");
                    }}
                  />
                  <Label
                    htmlFor={`drawer-cond-${item.id}`}
                    className="text-caption font-medium text-foreground-secondary cursor-pointer flex-1"
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
  );
}
