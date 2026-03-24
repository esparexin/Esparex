"use client";

import { startTransition, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { getServicesPage, type ServiceFilters, type Service, type ServicePageResult } from "@/lib/api/user/services";
import { getCategories } from "@/lib/api/user/categories";
import type { Category } from "@/lib/api/user/categories";

import { BrowseServicesFilters } from "@/components/user/BrowseServicesFilters";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { useLocationState } from "@/context/LocationContext";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import logger from "@/lib/logger";

const BrowseServicesResults = dynamic(
  () => import("./BrowseServicesResults"),
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
const DEFAULT_SERVICE_RADIUS_KM = 50;

interface BrowseServicesProps {
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: ServicePageResult;
  initialCategories?: Category[];
}

export function BrowseServices({
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
}: BrowseServicesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, isLoaded } = useLocationState();

  // ── Filter state ──────────────────────────────────────────────────────────────
  const [query, setQuery] = useState(searchParams.get("q") ?? initialSearchQuery);
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") ?? initialCategory ?? ""
  );
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // ── Data state ────────────────────────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>(initialResults?.data ?? []);
  const [total, setTotal] = useState(initialResults?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initialResults?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load categories once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      return;
    }

    getCategories()
      .then(setCategories)
      .catch(() => { /* non-critical */ });
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

  // ── Core fetch ────────────────────────────────────────────────────────────────
  const fetchServices = useCallback(async (overridePage?: number) => {
    setLoading(true);
    setError(null);
    const currentPage = overridePage ?? page;

    const filters: ServiceFilters = {
      page: currentPage,
      limit: PAGE_SIZE,
    };

    if (query.trim()) filters.search = query.trim();
    if (selectedCategory) filters.categoryId = selectedCategory;

    // Geo filter — use canonical helpers from lib/location/utils
    if (location) {
      const isRegionLevel = location.level === "state" || location.level === "country";
      const regionLocationLabel =
        location.level === "state"
          ? (location.state || location.city || undefined)
          : location.level === "country"
            ? (location.country || location.state || location.city || undefined)
            : undefined;

      if (location.locationId) {
        filters.locationId = location.locationId;
        if (location.level) {
          filters.level = location.level;
        }
        if (regionLocationLabel) {
          filters.location = regionLocationLabel;
        }
      }
      const lat = getLatitude(location);
      const lng = getLongitude(location);
      if (!isRegionLevel && lat != null && lng != null && !filters.locationId) {
        filters.lat = lat;
        filters.lng = lng;
        filters.radiusKm = DEFAULT_SERVICE_RADIUS_KM;
      } else if (regionLocationLabel) {
        filters.location = regionLocationLabel;
      }
    }

    try {
      const result = await getServicesPage(filters);
      setServices(prev =>
        currentPage === 1 ? result.data : [...prev, ...result.data]
      );
      setTotal(result.pagination.total ?? result.data.length);
      setHasMore(result.pagination.hasMore ?? false);
    } catch (err) {
      logger.error("[BrowseServices] fetch failed:", err);
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, page, location]);

  // ── Re-fetch on filter change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return; // Wait for location to settle before first fetch
    if (!skippedInitialFetchRef.current && shouldUseInitialResults) {
      skippedInitialFetchRef.current = true;
      setLoading(false);
      return;
    }
    setPage(1);
    fetchServices(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory, isLoaded, shouldUseInitialResults]);

  // ── Re-fetch when location resolves (geo-filter update) ──────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!skippedInitialFetchRef.current && shouldUseInitialResults) {
      skippedInitialFetchRef.current = true;
      setLoading(false);
      return;
    }
    setPage(1);
    fetchServices(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.coordinates, location.locationId, isLoaded, shouldUseInitialResults]);

  // ── Debounced keyword ─────────────────────────────────────────────────────────
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.replace(`/browse-services?${params.toString()}`, { scroll: false });
    }, DEBOUNCE_MS);
  };

  const handleReset = () => {
    startTransition(() => {
      setQuery("");
      setInputValue("");
      setSelectedCategory("");
      setSort("newest");
      setPage(1);
      router.replace("/browse-services", { scroll: false });
    });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    startTransition(() => {
      setPage(nextPage);
      void fetchServices(nextPage);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
      <BrowseServicesFilters
        inputValue={inputValue}
        selectedCategory={selectedCategory}
        categories={categories}
        onInputChange={handleInputChange}
        onCategoryChange={setSelectedCategory}
        onReset={handleReset}
      />

      {/* ── Main Results ──────────────────────────────────────────────────── */}
      <BrowseServicesResults
        services={services}
        total={total}
        sort={sort}
        view={view}
        loading={loading}
        error={error}
        hasMore={hasMore}
        query={query}
        onSortChange={setSort}
        onViewChange={setView}
        onRetry={() => void fetchServices(1)}
        onReset={handleReset}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
