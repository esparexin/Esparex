import { useEffect, useMemo } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { buildPublicBrowseRoute } from "@/lib/publicBrowseRoutes";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { DEFAULT_PRICE_RANGE } from "./useFilterState";

export function useUrlSync(
  routeParams: any,
  router: AppRouterInstance,
  query: string, setQuery: (val: any) => void,
  selectedCategory: string | null, setSelectedCategory: (val: any) => void,
  priceRange: [number, number], setPriceRange: (val: any) => void,
  selectedBrands: string[], setSelectedBrands: (val: any) => void,
  radiusKm: number, setRadiusKm: (val: any) => void,
  sort: SortOption, setSort: (val: any) => void,
  page: number, setPage: (val: any) => void,
  showRadiusFilter: boolean,
  urlModelId: string,
  urlLocationId: string,
  urlLocationLabel: string
) {
  useEffect(() => {
    const nextQuery = routeParams.q ?? "";
    const nextCategory = routeParams.categoryId ?? routeParams.category ?? null;
    const nextSort = (routeParams.sort as SortOption | undefined) ?? "newest";
    const nextPriceRange: [number, number] = [
      routeParams.minPrice ?? DEFAULT_PRICE_RANGE[0],
      routeParams.maxPrice ?? DEFAULT_PRICE_RANGE[1],
    ];
    const nextBrands = routeParams.brands
      ? routeParams.brands.split(",").map((brand: string) => brand.trim()).filter(Boolean)
      : [];
    const nextRadius = routeParams.radiusKm ?? 50;
    const nextPage = routeParams.page && routeParams.page > 0 ? routeParams.page : 1;

    setQuery((current: string) => (current === nextQuery ? current : nextQuery));
    setSelectedCategory((current: string | null) => (current === nextCategory ? current : nextCategory));
    setPriceRange((current: [number, number]) =>
      current[0] === nextPriceRange[0] && current[1] === nextPriceRange[1] ? current : nextPriceRange
    );
    setSelectedBrands((current: string[]) =>
      current.join(",") === nextBrands.join(",") ? current : nextBrands
    );
    setRadiusKm((current: number) => (current === nextRadius ? current : nextRadius));
    setSort((current: SortOption) => (current === nextSort ? current : nextSort));
    setPage((current: number) => (current === nextPage ? current : nextPage));
  }, [
    routeParams.brands,
    routeParams.category,
    routeParams.categoryId,
    routeParams.maxPrice,
    routeParams.minPrice,
    routeParams.page,
    routeParams.q,
    routeParams.radiusKm,
    routeParams.sort,
    setPage, setPriceRange, setQuery, setRadiusKm, setSelectedBrands, setSelectedCategory, setSort
  ]);

  const canonicalBrowseRoute = useMemo(
    () =>
      buildPublicBrowseRoute({
        type: "ad",
        q: query.trim() || undefined,
        category: selectedCategory ?? undefined,
        sort,
        minPrice: priceRange[0] > DEFAULT_PRICE_RANGE[0] ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < DEFAULT_PRICE_RANGE[1] ? priceRange[1] : undefined,
        brands: selectedBrands.length > 0 ? selectedBrands.join(",") : undefined,
        modelId: urlModelId || undefined,
        locationId: urlLocationId || undefined,
        location: urlLocationId ? undefined : urlLocationLabel || undefined,
        radiusKm: showRadiusFilter ? radiusKm : undefined,
      }),
    [priceRange, query, radiusKm, selectedBrands, selectedCategory, showRadiusFilter, sort, urlLocationId, urlLocationLabel, urlModelId]
  );

  const currentBrowseRoute = useMemo(
    () =>
      buildPublicBrowseRoute({
        type: routeParams.type,
        q: routeParams.q,
        category: routeParams.category,
        categoryId: routeParams.categoryId,
        modelId: routeParams.modelId,
        sort: routeParams.sort,
        minPrice: routeParams.minPrice,
        maxPrice: routeParams.maxPrice,
        location: routeParams.location,
        locationId: routeParams.locationId,
        brands: routeParams.brands,
        radiusKm: routeParams.radiusKm,
      }),
    [routeParams]
  );

  useEffect(() => {
    if (page !== 1) return;
    if (currentBrowseRoute !== canonicalBrowseRoute) {
      router.replace(canonicalBrowseRoute, { scroll: false });
    }
  }, [canonicalBrowseRoute, currentBrowseRoute, page, router]);
}
