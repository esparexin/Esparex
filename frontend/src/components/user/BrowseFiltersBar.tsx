"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import type { Category } from "@/lib/api/user/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

interface BrowseFiltersBarProps {
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
  respectMobileChromePolicy?: boolean;
  inputClassName?: string;
  selectTriggerClassName?: string;
}

export const BrowseFiltersBar = memo(function BrowseFiltersBar({
  inputId,
  inputValue,
  selectedCategory,
  categories,
  searchAriaLabel,
  searchPlaceholder,
  onInputChange,
  onCategoryChange,
  onReset,
  getCategoryValue = (category) => category.id,
  respectMobileChromePolicy = false,
  inputClassName = "pl-9 h-11 rounded-xl bg-white border-slate-200 focus:border-slate-300 transition-colors",
  selectTriggerClassName = "h-11 flex-1 sm:flex-none sm:w-44 rounded-xl bg-slate-50 border-slate-200",
}: BrowseFiltersBarProps) {
  const pathname = usePathname();
  const chromePolicy = getMobileChromePolicy(pathname);

  if (respectMobileChromePolicy && !chromePolicy.showStickySearch) {
    return null;
  }

  return (
    <div className="sticky top-[6.25rem] md:top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[180px] sm:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            id={inputId}
            aria-label={searchAriaLabel}
            placeholder={searchPlaceholder}
            className={inputClassName}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 sm:contents">
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => onCategoryChange(value === "all" ? "" : value)}
          >
            <SelectTrigger className={selectTriggerClassName}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => {
                const value = getCategoryValue(category);
                if (!value) {
                  return null;
                }

                return (
                  <SelectItem key={category.id} value={value}>
                    {category.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {(inputValue || selectedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="shrink-0 h-11 text-slate-500 hover:text-red-600"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
