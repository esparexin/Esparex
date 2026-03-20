"use client";

import dynamic from "next/dynamic";
import {
  PackageOpen,
  RefreshCw,
} from "lucide-react";

import type { Service } from "@/api/user/services";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { SearchResultsHeader } from "@/components/search/SearchResultsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrowseServicesCard } from "@/components/user/BrowseServicesCard";

interface BrowseServicesResultsProps {
  services: Service[];
  total: number;
  sort: SortOption;
  view: "grid" | "list";
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  query: string;
  onSortChange: (value: SortOption) => void;
  onViewChange: (value: "grid" | "list") => void;
  onRetry: () => void;
  onReset: () => void;
  onLoadMore: () => void;
}

const VIRTUALIZATION_THRESHOLD = 24;

const BrowseServicesVirtualizedList = dynamic(
  () => import("./BrowseServicesVirtualizedList"),
  {
    loading: () => <GridSkeleton />,
  }
);

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function BrowseServicesResults({
  services,
  total,
  sort,
  view,
  loading,
  error,
  hasMore,
  query,
  onSortChange,
  onViewChange,
  onRetry,
  onReset,
  onLoadMore,
}: BrowseServicesResultsProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 space-y-4">
      <SearchResultsHeader
        total={loading && services.length === 0 ? 0 : total}
        sort={sort}
        view={view}
        onSortChange={onSortChange}
        onViewChange={onViewChange}
      />

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      )}

      {loading && services.length === 0 && !error && <GridSkeleton />}

      {!loading && !error && services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-100 p-6 mb-4">
            <PackageOpen className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No services found
          </h3>
          <p className="text-slate-500 max-w-xs mb-6">
            {query ? `No services matching "${query}".` : "No services available in this area yet."}
          </p>
          <Button variant="outline" onClick={onReset}>
            Clear Filters
          </Button>
        </div>
      )}

      {services.length > 0 &&
        (services.length > VIRTUALIZATION_THRESHOLD ? (
          <BrowseServicesVirtualizedList services={services} view={view} />
        ) : (
          <div
            className={
              view === "list"
                ? "flex flex-col gap-3 pb-8"
                : "grid grid-cols-2 gap-3 pb-8 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
            }
          >
            {services.map((service) => (
              <BrowseServicesCard key={service.id} service={service} />
            ))}
          </div>
        ))}

      {hasMore && !loading && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" size="lg" onClick={onLoadMore} className="min-w-[180px]">
            Load More
          </Button>
        </div>
      )}

      {loading && services.length > 0 && (
        <div className="flex justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  );
}
