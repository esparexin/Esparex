import type { Metadata } from "next";
import { generateAdSlug } from "@/lib/slug";
import { toCanonicalUrl } from "@/lib/seo/canonicalHost";

export type CatalogSlugEntity = "brand" | "model";

export interface CatalogSlugRecord {
  id: string;
  name: string;
  slug?: string;
  contextLabel?: string | null;
}

export const ENTITY_CONFIG: Record<
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
    metadataTitle: (name) => `${name} Listings`,
    metadataDescription: (name) =>
      `Browse live ads, services, and spare parts for the ${name} brand on Esparex.`,
    heading: (name) => `${name} Marketplace`,
    description: (name) =>
      `Real live listings for ${name} devices, repairs, and spare parts.`,
    browseLabel: "Browse all brand listings",
  },
  model: {
    metadataTitle: (name) => `${name} Listings`,
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
  const canonicalSlug = record.slug || generateAdSlug(record.name);
  const canonicalParam = `${canonicalSlug}-${record.id}`;
  const basePath = entity === "brand" ? "brands" : "models";
  return {
    title: config.metadataTitle(record.name),
    description: config.metadataDescription(record.name, record.contextLabel),
    alternates: {
      canonical: toCanonicalUrl(`/${basePath}/${canonicalParam}`),
    },
  };
}
