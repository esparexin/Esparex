"use client";

import Link from "next/link";
import { ChevronRight } from "@/icons/IconRegistry";
import { cn } from "@/lib/utils";

interface BrowseBreadcrumbProps {
  categoryName?: string | null;
  locationLabel?: string | null;
  total?: number;
  className?: string;
}

export function BrowseBreadcrumb({
  categoryName,
  locationLabel,
  total,
  className,
}: BrowseBreadcrumbProps) {
  const displayTitle = categoryName ? categoryName : "All Categories";

  return (
    <div className={cn("space-y-2 py-2 md:py-3", className)}>
      {/* Semantic Accessible Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs md:text-sm text-slate-500 font-medium overflow-x-auto no-scrollbar">
        <ol className="flex items-center space-x-1.5 md:space-x-2 whitespace-nowrap">
          <li>
            <Link
              href="/"
              className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link
              href="/browse"
              className={cn(
                "hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm",
                !categoryName && "text-slate-900 font-semibold"
              )}
              aria-current={!categoryName ? "page" : undefined}
            >
              Browse
            </Link>
          </li>
          {categoryName && (
            <>
              <li aria-hidden="true" className="text-slate-300">
                <ChevronRight className="size-3.5" />
              </li>
              <li className="text-slate-900 font-semibold truncate max-w-[200px] md:max-w-[300px]" aria-current="page">
                {categoryName}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Main Page Title + Location Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-4 border-b border-slate-100 pb-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {displayTitle}
            {locationLabel && (
              <span className="text-slate-600 font-normal text-lg md:text-xl ml-1.5">
                in <span className="font-semibold text-slate-800">{locationLabel}</span>
              </span>
            )}
          </h1>
        </div>

        {typeof total === "number" && (
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 font-medium shrink-0">
            <span className={cn("size-2 rounded-full", total > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
            <span>
              <strong className="text-slate-900 font-semibold">{total}</strong> {total === 1 ? "listing" : "listings"} found
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
