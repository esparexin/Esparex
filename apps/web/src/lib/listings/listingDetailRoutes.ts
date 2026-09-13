import type { Metadata, ResolvingMetadata } from "next";
import { generateAdSlug } from "@/lib/slug";
import { toCanonicalUrl } from "@/lib/seo/canonicalHost";

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
  buildStructuredData: (ad) => {
    const slug = ad.seoSlug || generateAdSlug(ad.title || "");
    const canonicalUrl = ad.id ? toCanonicalUrl(`/ads/${slug}-${ad.id}`) : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: ad.title,
      description: ad.description,
      image: ad.images || [],
      url: canonicalUrl,
      offers: {
        "@type": "Offer",
        price: ad.price,
        priceCurrency: ad.currency || "INR",
        itemCondition: ad.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        availability:
          ad.status === "live"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: ad.sellerName
          ? { "@type": "Person", name: ad.sellerName }
          : undefined,
      },
      brand: ad.brandName ? { "@type": "Brand", name: ad.brandName } : undefined,
    };
  },
};

const serviceListingRouteConfig: ListingDetailRouteConfig = {
  missingTitle: "Service Not Found | Esparex",
  canonicalBasePath: "/services",
  buildStructuredData: (service) => {
    const slug = service.seoSlug || generateAdSlug(service.title || "");
    const canonicalUrl = service.id ? toCanonicalUrl(`/services/${slug}-${service.id}`) : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      image: service.images || [],
      url: canonicalUrl,
      provider: {
        "@type": "LocalBusiness",
        name: service.sellerName || "Service Provider",
      },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: service.priceMin || service.price,
        highPrice: service.priceMax,
        priceCurrency: service.currency || "INR",
        availability:
          service.status === "live"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
    };
  },
};

const sparePartListingRouteConfig: ListingDetailRouteConfig = {
  missingTitle: "Spare Part Not Found | Esparex",
  canonicalBasePath: "/spare-part-listings",
  buildStructuredData: (listing) => {
    const slug = listing.seoSlug || generateAdSlug(listing.title || "");
    const canonicalUrl = listing.id ? toCanonicalUrl(`/spare-part-listings/${slug}-${listing.id}`) : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: listing.title,
      description: listing.description,
      image: listing.images || [],
      url: canonicalUrl,
      offers: {
        "@type": "Offer",
        price: listing.price,
        priceCurrency: listing.currency || "INR",
        itemCondition: listing.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        availability:
          listing.status === "live"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        seller: listing.sellerName
          ? { "@type": "Person", name: listing.sellerName }
          : undefined,
      },
      brand: listing.brandName ? { "@type": "Brand", name: listing.brandName } : undefined,
    };
  },
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
