"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import type { Category } from "@/api/user/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

interface BrowseServicesFiltersProps {
  inputValue: string;
  selectedCategory: string;
  categories: Category[];
  onInputChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
}

export const BrowseServicesFilters = memo(function BrowseServicesFilters({
  inputValue,
  selectedCategory,
  categories,
  onInputChange,
  onCategoryChange,
  onReset,
}: BrowseServicesFiltersProps) {
  const pathname = usePathname();
  const chromePolicy = getMobileChromePolicy(pathname);

  if (!chromePolicy.showStickySearch) {
    return null;
  }

  return (
    <div className="sticky top-[6.25rem] md:top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            id="browse-services-search"
            aria-label="Search services"
            placeholder="Search repair services..."
            className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
          />
        </div>

        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) => onCategoryChange(value === "all" ? "" : value)}
        >
          <SelectTrigger className="h-11 w-44 bg-slate-50 border-slate-200">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug ?? cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(inputValue || selectedCategory) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="shrink-0 text-slate-500 hover:text-red-600"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
});
