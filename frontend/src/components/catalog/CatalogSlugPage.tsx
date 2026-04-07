import Link from "next/link";
import type { Metadata } from "next";

import { AdCardGrid } from "@/components/user/ad-card";
import { Button } from "@/components/ui/button";
import type { ListingPageResult } from "@/lib/api/user/listings";

export type CatalogSlugEntity = "brand" | "model";

export interface CatalogSlugRecord {
  id: string;
  name: string;
  slug?: string;
  contextLabel?: string | null;
}

const ENTITY_CONFIG: Record<
  CatalogSlugEntity,
  {
    metadataTitle: (name: string) => string;
    metadataDescription: (name: string, contextLabel?: string | null) => string;
    heading: (name: string) => string;
    description: (name: string, contextLabel?: string | null) => string;
    browseLabel: string;
  }
> = {
  brand: {
    metadataTitle: (name) => `${name} Listings | Esparex`,
    metadataDescription: (name) =>
      `Browse live ads, services, and spare parts for the ${name} brand on Esparex.`,
    heading: (name) => `${name} Marketplace`,
    description: (name) =>
      `Real live listings for ${name} devices, repairs, and spare parts.`,
    browseLabel: "Browse all brand listings",
  },
  model: {
    metadataTitle: (name) => `${name} Listings | Esparex`,
    metadataDescription: (name, contextLabel) =>
      contextLabel
        ? `Browse live ${contextLabel} ${name} ads, repairs, and spare parts on Esparex.`
        : `Browse live ${name} ads, repairs, and spare parts on Esparex.`,
    heading: (name) => `${name} Listings`,
    description: (name, contextLabel) =>
      contextLabel
        ? `Live marketplace listings for ${contextLabel} ${name}.`
        : `Live marketplace listings for ${name}.`,
    browseLabel: "Browse all model listings",
  },
};

export function buildCatalogSlugMetadata(
  entity: CatalogSlugEntity,
  record: CatalogSlugRecord
): Metadata {
  const config = ENTITY_CONFIG[entity];
  return {
    title: config.metadataTitle(record.name),
    description: config.metadataDescription(record.name, record.contextLabel),
  };
}

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
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-link">
              {entity === "brand" ? "Brand Landing" : "Model Landing"}
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {config.heading(record.name)}
            </h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              {config.description(record.name, record.contextLabel)}
            </p>
            {record.contextLabel ? (
              <p className="text-sm font-medium text-slate-500">
                Connected to <span className="text-slate-800">{record.contextLabel}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
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
                <h2 className="text-2xl font-bold text-slate-900">Featured results</h2>
                <p className="mt-1 text-sm text-slate-500">
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
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">No live listings yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
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
