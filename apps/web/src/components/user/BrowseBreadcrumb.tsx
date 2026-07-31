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
    <div className={cn("space-y-1 py-1 md:py-2", className)}>
      {/* Semantic Accessible Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs md:text-sm text-slate-500 font-normal overflow-x-auto no-scrollbar">
        <ol className="flex items-center space-x-1 md:space-x-2 whitespace-nowrap">
          <li>
            <Link
              href="/"
              className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            <ChevronRight className="size-3" />
          </li>
          <li>
            <Link
              href="/browse"
              className={cn(
                "hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm",
                !categoryName && "text-slate-800 font-normal"
              )}
              aria-current={!categoryName ? "page" : undefined}
            >
              Browse
            </Link>
          </li>
          {categoryName && (
            <>
              <li aria-hidden="true" className="text-slate-300">
                <ChevronRight className="size-3" />
              </li>
              <li className="text-slate-700 font-normal truncate max-w-[160px] md:max-w-[300px]" aria-current="page">
                {categoryName}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Main Page Title + Location Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 border-b border-slate-100/80 pb-2 pt-0.5">
        <div>
          <h1 className="text-base sm:text-xl font-normal sm:font-semibold text-slate-800 tracking-normal leading-relaxed">
            {displayTitle}
            {locationLabel && (
              <span className="text-slate-500 font-normal text-xs md:text-sm ml-1.5">
                in <span className="font-normal text-slate-700">{locationLabel}</span>
              </span>
            )}
          </h1>
        </div>
      </div>
    </div>
  );
}
