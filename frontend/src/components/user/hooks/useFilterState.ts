import { useState, startTransition } from "react";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { useRouter } from "next/navigation";
import { buildPublicBrowseRoute } from "@/lib/publicBrowseRoutes";

export const DEFAULT_PRICE_RANGE: [number, number] = [0, 200000];

export function useFilterState(routeParams: any, initialSearchQuery: string, initialCategory?: string) {
  const router = useRouter();
  const [query, setQuery] = useState(
    routeParams.q ?? initialSearchQuery
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    routeParams.categoryId ?? routeParams.category ?? initialCategory ?? null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    routeParams.minPrice ?? DEFAULT_PRICE_RANGE[0],
    routeParams.maxPrice ?? DEFAULT_PRICE_RANGE[1],
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    routeParams.brands ? routeParams.brands.split(",").map((brand: string) => brand.trim()).filter(Boolean) : []
  );
  const [radiusKm, setRadiusKm] = useState(routeParams.radiusKm ?? 50);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortOption>((routeParams.sort as SortOption | undefined) ?? "newest");
  const [page, setPage] = useState(routeParams.page && routeParams.page > 0 ? routeParams.page : 1);

  const handleReset = () => {
    startTransition(() => {
      setQuery("");
      setSelectedCategory(null);
      setPriceRange(DEFAULT_PRICE_RANGE);
      setSelectedBrands([]);
      setRadiusKm(50);
      setCategoryFilters({});
      setSort("newest");
      setPage(1);
      router.replace(buildPublicBrowseRoute({ type: "ad" }), { scroll: false });
    });
  };

  return {
    query, setQuery,
    selectedCategory, setSelectedCategory,
    priceRange, setPriceRange,
    selectedBrands, setSelectedBrands,
    radiusKm, setRadiusKm,
    categoryFilters, setCategoryFilters,
    sort, setSort,
    page, setPage,
    handleReset
  };
}
