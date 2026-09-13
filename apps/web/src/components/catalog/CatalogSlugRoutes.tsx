import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  CatalogSlugPage,
  buildCatalogSlugMetadata,
  type CatalogSlugEntity,
  type CatalogSlugRecord,
} from "@/components/catalog/CatalogSlugPage";
import { fetchCatalogRecordServer } from "@/lib/api/user/masterData";
import { getAdsPage } from "@/lib/api/user/listings";
import { buildCatalogLinkedBrowseRoute } from "@/lib/publicBrowseRoutes";
import { generateAdSlug, parseSlugIdParam } from "@/lib/slug";

type CatalogSlugRouteProps = {
  params: Promise<{ slug: string }>;
};

const extractId = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return extractId(record.id ?? record._id);
  }
  return null;
};

const normalizeCatalogRecord = (
  entity: CatalogSlugEntity,
  payload: unknown
): CatalogSlugRecord | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const id = extractId(record.id ?? record._id);
  const name = typeof record.name === "string" ? record.name.trim() : "";

  if (!id || !name) {
    return null;
  }

  if (entity === "brand") {
    return {
      id,
      name,
      slug: typeof record.slug === "string" ? record.slug.trim() : undefined,
      contextLabel: null,
    };
  }

  const brandRecord =
    record.brandId && typeof record.brandId === "object"
      ? (record.brandId as Record<string, unknown>)
      : null;

  return {
    id,
    name,
    contextLabel:
      brandRecord && typeof brandRecord.name === "string" ? brandRecord.name.trim() : null,
  };
};

const resolveCatalogRecord = cache(
  async (
    entity: CatalogSlugEntity,
    identifier: string,
    fetchById: boolean
  ): Promise<CatalogSlugRecord | null> => {
    const payload = await fetchCatalogRecordServer(entity, identifier, fetchById);
    return normalizeCatalogRecord(entity, payload);
  }
);

const resolveCatalogPageData = cache(
  async (entity: CatalogSlugEntity, identifier: string, fetchById: boolean) => {
    const record = await resolveCatalogRecord(entity, identifier, fetchById);
    if (!record) {
      return null;
    }

    const listings = await getAdsPage(
      {
        status: "live",
        page: 1,
        limit: 12,
        ...(entity === "brand" ? { brandId: record.id } : { modelId: record.id }),
      },
      { fetchOptions: { next: { revalidate: 60 } } }
    );

    return { record, listings };
  }
);

function createCatalogSlugMetadata(entity: CatalogSlugEntity) {
  return async function generateMetadata({
    params,
  }: CatalogSlugRouteProps): Promise<Metadata> {
    const { slug } = await params;
    if (!slug) {
      return {
        title: "Catalog Page | Esparex",
        robots: { index: false, follow: false },
      };
    }

    const parsed = parseSlugIdParam(slug);
    const record = await resolveCatalogRecord(
      entity,
      parsed.identifier || parsed.slug,
      Boolean(parsed.id)
    );

    return record
      ? buildCatalogSlugMetadata(entity, record)
      : {
          title: "Catalog Page Not Found | Esparex",
          robots: { index: false, follow: false },
        };
  };
}

function createCatalogSlugPage(entity: CatalogSlugEntity) {
  return async function CatalogEntityRoute({ params }: CatalogSlugRouteProps) {
    const { slug } = await params;
    if (!slug) {
      notFound();
    }

    const parsed = parseSlugIdParam(slug);
    const pageData = await resolveCatalogPageData(
      entity,
      parsed.identifier || parsed.slug,
      Boolean(parsed.id)
    );

    if (!pageData) {
      notFound();
    }

    const canonicalSlug = pageData.record.slug || generateAdSlug(pageData.record.name);
    const canonicalParam = `${canonicalSlug}-${pageData.record.id}`;
    if (slug !== canonicalParam) {
      permanentRedirect(`/${entity === "brand" ? "brands" : "models"}/${canonicalParam}`);
    }

    const browseHref = buildCatalogLinkedBrowseRoute({
      entity,
      id: pageData.record.id,
    });

    return (
      <CatalogSlugPage
        entity={entity}
        record={pageData.record}
        listings={pageData.listings}
        browseHref={browseHref}
      />
    );
  };
}

export const generateBrandSlugMetadata = createCatalogSlugMetadata("brand");
export const BrandSlugPage = createCatalogSlugPage("brand");
export const generateModelSlugMetadata = createCatalogSlugMetadata("model");
export const ModelSlugPage = createCatalogSlugPage("model");
