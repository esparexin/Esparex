import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CatalogSlugPage,
  buildCatalogSlugMetadata,
  type CatalogSlugEntity,
} from "@/components/catalog/CatalogSlugPage";

type CatalogSlugRouteProps = {
  params: Promise<{ slug: string }>;
};

function createCatalogSlugMetadata(entity: CatalogSlugEntity) {
  return async function generateMetadata({
    params,
  }: CatalogSlugRouteProps): Promise<Metadata> {
    const { slug } = await params;
    return buildCatalogSlugMetadata(entity, slug || "");
  };
}

function createCatalogSlugPage(entity: CatalogSlugEntity) {
  return async function CatalogEntityRoute({ params }: CatalogSlugRouteProps) {
    const { slug } = await params;
    if (!slug) notFound();
    return <CatalogSlugPage entity={entity} slug={slug} />;
  };
}

export const generateBrandSlugMetadata = createCatalogSlugMetadata("brand");
export const BrandSlugPage = createCatalogSlugPage("brand");
export const generateModelSlugMetadata = createCatalogSlugMetadata("model");
export const ModelSlugPage = createCatalogSlugPage("model");
