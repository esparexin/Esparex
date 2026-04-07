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
  canonicalBasePath: "/ads" | "/services" | "/spare-part-listings";
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
    url: ad.id ? `https://esparex.in/ads/${ad.id}` : undefined,
    offers: {
      "@type": "Offer",
      price: ad.price,
      priceCurrency: "INR",
      availability:
        ad.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: ad.sellerName
        ? { "@type": "Person", name: ad.sellerName }
        : undefined,
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
    url: service.id ? `https://esparex.in/services/${service.id}` : undefined,
    provider: {
      "@type": "LocalBusiness",
      name: service.sellerName || "Service Provider",
    },
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: "INR",
      availability:
        service.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  }),
};

const sparePartListingRouteConfig: ListingDetailRouteConfig = {
  missingTitle: "Spare Part Not Found | Esparex",
  canonicalBasePath: "/spare-part-listings",
  buildStructuredData: (listing) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images || [],
    url: listing.id ? `https://esparex.in/spare-part-listings/${listing.id}` : undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "INR",
      availability:
        listing.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: listing.sellerName
        ? { "@type": "Person", name: listing.sellerName }
        : undefined,
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
export const generateSparePartPageMetadata = createListingPageMetadata(
  sparePartListingRouteConfig
);
export const SparePartListingPage = createListingDetailRoute(
  sparePartListingRouteConfig
);
