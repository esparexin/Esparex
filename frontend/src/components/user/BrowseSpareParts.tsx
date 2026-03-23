"use client";

import { startTransition, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import {
  getSparePartListingsPage,
  type SparePartListingFilters,
  type SparePartListing,
  type SparePartListingPageResult,
} from "@/api/user/sparePartListings";
import { getCategories } from "@/api/user/categories";
import type { Category } from "@/api/user/categories";

import type { SortOption } from "@/components/search/SearchResultsHeader";
import { useLocationState } from "@/context/LocationContext";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import logger from "@/lib/logger";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BrowseSparePartsResults = dynamic(
  () => import("./BrowseSparePartsResults"),
  {
    loading: () => (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video w-full rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-slate-200/70 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-slate-200/70 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ),
  }
);

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 350;
const DEFAULT_RADIUS_KM = 50;

interface BrowseSparePartsProps {
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: SparePartListingPageResult;
  initialCategories?: Category[];
}

export function BrowseSpareParts({
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
}: BrowseSparePartsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, isLoaded } = useLocationState();

  const [query, setQuery] = useState(searchParams.get("q") ?? initialSearchQuery);
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") ?? initialCategory ?? ""
  );
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const [listings, setListings] = useState<SparePartListing[]>(initialResults?.data ?? []);
  const [total, setTotal] = useState(initialResults?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initialResults?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) return;
    getCategories().then(setCategories).catch(() => {});
  }, [initialCategories]);

  const hasLocationFilter = useMemo(() => {
    const lat = getLatitude(location);
    const lng = getLongitude(location);
    return Boolean(location.locationId) || (lat != null && lng != null);
  }, [location]);

  const shouldUseInitialResults = useMemo(() => (
    Boolean(initialResults) &&
    page === 1 &&
    query.trim() === initialSearchQuery.trim() &&
    selectedCategory === (initialCategory ?? "") &&
    sort === "newest" &&
    !hasLocationFilter
  ), [hasLocationFilter, initialCategory, initialResults, initialSearchQuery, page, query, selectedCategory, sort]);

  const skippedInitialFetchRef = useRef(false);

  const fetchListings = useCallback(async (overridePage?: number) => {
    setLoading(true);
    setError(null);
    const currentPage = overridePage ?? page;

    const filters: SparePartListingFilters = {
      page: currentPage,
      limit: PAGE_SIZE,
    };

    if (query.trim()) filters.search = query.trim();
    if (selectedCategory) filters.categoryId = selectedCategory;

    if (location) {
      const isRegionLevel = location.level === "state" || location.level === "country";
      if (location.locationId) {
        filters.locationId = location.locationId;
      }
      const lat = getLatitude(location);
      const lng = getLongitude(location);
      if (!isRegionLevel && lat != null && lng != null && !filters.locationId) {
        filters.lat = lat;
        filters.lng = lng;
        filters.radiusKm = DEFAULT_RADIUS_KM;
      }
    }

    try {
      const result = await getSparePartListingsPage(filters);
      setListings(prev =>
        currentPage === 1 ? result.data : [...prev, ...result.data]
      );
      setTotal(result.pagination.total ?? result.data.length);
      setHasMore(result.pagination.hasMore ?? false);
    } catch (err) {
      logger.error("[BrowseSpareParts] fetch failed:", err);
      setError("Failed to load spare parts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, page, location]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!skippedInitialFetchRef.current && shouldUseInitialResults) {
      skippedInitialFetchRef.current = true;
      setLoading(false);
      return;
    }
    setPage(1);
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory, isLoaded, shouldUseInitialResults]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!skippedInitialFetchRef.current && shouldUseInitialResults) {
      skippedInitialFetchRef.current = true;
      setLoading(false);
      return;
    }
    setPage(1);
    fetchListings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.coordinates, location.locationId, isLoaded, shouldUseInitialResults]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.replace(`/browse-spare-parts?${params.toString()}`, { scroll: false });
    }, DEBOUNCE_MS);
  };

  const handleReset = () => {
    startTransition(() => {
      setQuery("");
      setInputValue("");
      setSelectedCategory("");
      setSort("newest");
      setPage(1);
      router.replace("/browse-spare-parts", { scroll: false });
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    startTransition(() => {
      setPage(nextPage);
      void fetchListings(nextPage);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* Filter bar */}
      <div className="sticky top-[6.25rem] md:top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              aria-label="Search spare parts"
              placeholder="Search spare parts…"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          <Select
            value={selectedCategory || "__all__"}
            onValueChange={(val) => setSelectedCategory(val === "__all__" ? "" : val)}
          >
            <SelectTrigger className="w-[160px] h-10 rounded-xl">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(query || selectedCategory) && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500">
              Clear
            </Button>
          )}
        </div>
      </div>

      <BrowseSparePartsResults
        listings={listings}
        total={total}
        sort={sort}
        view={view}
        loading={loading}
        error={error}
        hasMore={hasMore}
        query={query}
        onSortChange={setSort}
        onViewChange={setView}
        onRetry={() => void fetchListings(1)}
        onReset={handleReset}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
