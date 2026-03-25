import type { Metadata, ResolvingMetadata } from "next";

import {
  buildListingMetadata,
  renderListingDetailPage,
  type ListingLike,
  type ListingSlugPageProps,
  type ListingStructuredData,
} from "@/lib/listings/listingDetailPage";

type ListingDetailRouteConfig = {
  missingTitle: string;
  canonicalBasePath: "/ads" | "/services";
  buildStructuredData: (listing: ListingLike) => ListingStructuredData;
};

function createListingPageMetadata(config: ListingDetailRouteConfig) {
  return async function generateMetadata(
    { params }: ListingSlugPageProps,
    parent: ResolvingMetadata
  ): Promise<Metadata> {
    return buildListingMetadata({
      params,
      parent,
      missingTitle: config.missingTitle,
      canonicalBasePath: config.canonicalBasePath,
    });
  };
}

function createListingDetailRoute(config: ListingDetailRouteConfig) {
  return async function ListingDetailRoute({ params }: ListingSlugPageProps) {
    return renderListingDetailPage({
      params,
      canonicalBasePath: config.canonicalBasePath,
      buildStructuredData: config.buildStructuredData,
    });
  };
}

const adListingRouteConfig: ListingDetailRouteConfig = {
  missingTitle: "Listing Not Found | Esparex",
  canonicalBasePath: "/ads",
  buildStructuredData: (ad) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.title,
    description: ad.description,
    image: ad.images || [],
    offers: {
      "@type": "Offer",
      price: ad.price,
      priceCurrency: "IQD",
      availability:
        ad.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  }),
};

const serviceListingRouteConfig: ListingDetailRouteConfig = {
  missingTitle: "Service Not Found | Esparex",
  canonicalBasePath: "/services",
  buildStructuredData: (service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    image: service.images || [],
    provider: {
      "@type": "LocalBusiness",
      name: service.sellerName || "Service Provider",
    },
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: "IQD",
      availability:
        service.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  }),
};

export const generateAdPageMetadata = createListingPageMetadata(
  adListingRouteConfig
);
export const AdListingPage = createListingDetailRoute(adListingRouteConfig);
export const generateServicePageMetadata = createListingPageMetadata(
  serviceListingRouteConfig
);
export const ServiceListingPage = createListingDetailRoute(
  serviceListingRouteConfig
);
