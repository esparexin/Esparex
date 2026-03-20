/**
 * CatalogSlugPage Component
 * 
 * CORE DOMAIN ROLE: Marketplace Aggregator Gallery.
 * This page aggregates active marketplace listings from all sellers for a specific 
 * catalog entity (Brand, Model, or Spare Part). It serves as the primary "Landing Page" 
 * for catalog-driven search and SEO.
 */
import { BrowseAds } from "@/components/user/BrowseAds";
import type { Metadata } from "next";

export type CatalogSlugEntity = "brand" | "model" | "spare-part";

const ENTITY_CONFIG: Record<
  CatalogSlugEntity,
  {
    metadataTitle: (name: string) => string;
    metadataDescription: (name: string) => string;
    heading: (name: string) => string;
    description: (name: string) => string;
  }
> = {
  brand: {
    metadataTitle: (name) => `${name} | Esparex Brands`,
    metadataDescription: (name) =>
      `Browse ${name} mobile devices, electronics, and spare parts on Esparex.`,
    heading: (name) => name,
    description: (name) => `Explore all listings for ${name} brand.`,
  },
  model: {
    metadataTitle: (name) => `${name} | Esparex Models`,
    metadataDescription: (name) =>
      `Browse listings for ${name} devices and parts on Esparex.`,
    heading: (name) => name,
    description: (name) => `Explore all listings for ${name}.`,
  },
  "spare-part": {
    metadataTitle: (name) => `${name} Spare Parts | Esparex`,
    metadataDescription: (name) =>
      `Find ${name} spare parts and components on Esparex.`,
    heading: (name) => `${name} Parts`,
    description: (name) => `Find the right spare parts for ${name}.`,
  },
};

export function formatSlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildCatalogSlugMetadata(
  entity: CatalogSlugEntity,
  slug: string
): Metadata {
  const name = formatSlugToName(slug || "");
  const config = ENTITY_CONFIG[entity];

  return {
    title: config.metadataTitle(name),
    description: config.metadataDescription(name),
  };
}

interface CatalogSlugPageProps {
  entity: CatalogSlugEntity;
  slug: string;
}

export function CatalogSlugPage({ entity, slug }: CatalogSlugPageProps) {
  const name = formatSlugToName(slug);
  const config = ENTITY_CONFIG[entity];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            {config.heading(name)}
          </h1>
          <p className="mt-4 text-lg text-slate-600">{config.description(name)}</p>
        </div>
      </div>
      <BrowseAds initialSearchQuery={name} />
    </div>
  );
}
