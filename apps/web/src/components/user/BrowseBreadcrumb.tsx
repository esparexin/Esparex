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
  total: _total,
  className,
}: BrowseBreadcrumbProps) {
  const displayTitle = categoryName ? categoryName : "All Categories";

  return (
    <div className={cn("space-y-1 py-1 md:py-2", className)}>
      {/* Semantic Accessible Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-caption md:text-small text-muted-foreground font-normal overflow-x-auto no-scrollbar">
        <ol className="flex items-center space-x-1 md:space-x-2 whitespace-nowrap">
          <li>
            <Link
              href="/"
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/40">
            <ChevronRight className="size-3" />
          </li>
          <li>
            <Link
              href="/browse"
              className={cn(
                "hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
                !categoryName && "text-foreground font-medium"
              )}
              aria-current={!categoryName ? "page" : undefined}
            >
              Browse
            </Link>
          </li>
          {categoryName && (
            <>
              <li aria-hidden="true" className="text-muted-foreground/40">
                <ChevronRight className="size-3" />
              </li>
              <li className="text-foreground/90 font-normal truncate max-w-[160px] md:max-w-[300px]" aria-current="page">
                {categoryName}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Main Page Title + Location Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 border-b border-border/60 pb-2 pt-0.5">
        <div>
          <h1 className="text-body-lg sm:text-h4 font-medium sm:font-semibold text-foreground tracking-tight leading-relaxed">
            {displayTitle}
            {locationLabel && locationLabel !== "Location unavailable" && (
              <span className="text-muted-foreground font-normal text-caption md:text-small ml-1.5">
                in <span className="font-medium text-foreground">{locationLabel}</span>
              </span>
            )}
          </h1>
        </div>
      </div>
    </div>
  );
}
