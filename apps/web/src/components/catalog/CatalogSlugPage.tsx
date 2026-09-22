"use client";

import Link from "next/link";

import { AdCardGrid } from "@/components/user/ad-card";
import { Button } from "@esparex/ui";
import type { ListingPageResult } from "@/lib/api/user/listings";
import {
  ENTITY_CONFIG,
  type CatalogSlugEntity,
  type CatalogSlugRecord,
} from "./catalogMetadata";

export type { CatalogSlugEntity, CatalogSlugRecord };

interface CatalogSlugPageProps {
  entity: CatalogSlugEntity;
  record: CatalogSlugRecord;
  listings: ListingPageResult;
  browseHref: string;
}

export function CatalogSlugPage({
  entity,
  record,
  listings,
  browseHref,
}: CatalogSlugPageProps) {
  const config = ENTITY_CONFIG[entity];
  const items = listings.data;
  const total = listings.pagination.total ?? items.length;

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--muted)/0.3)_0%,hsl(var(--primary)/0.05)_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-caption font-semibold uppercase tracking-widest text-primary">
              {entity === "brand" ? "Brand Landing" : "Model Landing"}
            </p>
            <h1 className="text-h1 font-bold tracking-tight text-foreground sm:text-5xl">
              {config.heading(record.name)}
            </h1>
            <p className="text-body-lg leading-7 text-foreground-tertiary sm:text-h4">
              {config.description(record.name, record.contextLabel)}
            </p>
            {record.contextLabel ? (
              <p className="text-body font-medium text-muted-foreground">
                Connected to <span className="text-foreground-secondary">{record.contextLabel}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="rounded-full border border-border bg-card px-4 py-2 text-body font-medium text-foreground-secondary">
                {total} live result{total === 1 ? "" : "s"}
              </div>
              <Button asChild className="rounded-full px-5">
                <Link href={browseHref}>{config.browseLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {items.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-h2 font-bold text-foreground">Featured results</h2>
                <p className="mt-1 text-body text-muted-foreground">
                  Live public listings tied to this {entity.replace("-", " ")}.
                  {total > items.length
                    ? ` Showing ${items.length} featured results here; use the browse action above for the full catalog view.`
                    : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.map((listing, index) => (
                <AdCardGrid key={String(listing.id)} ad={listing} priority={index < 4} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-16 text-center shadow-xs">
            <h2 className="text-h2 font-bold text-foreground">No live listings yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-body leading-6 text-muted-foreground">
              This {entity.replace("-", " ")} exists in the catalog, but there are no live public
              listings connected to it right now.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link href={browseHref}>{config.browseLabel}</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
