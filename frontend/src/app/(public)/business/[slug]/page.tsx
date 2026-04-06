import { cache } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { BusinessPublicProfile } from "@/components/business/BusinessPublicProfile";
import {
  getBusinessAds,
  getBusinessById,
  getBusinessServices,
  getBusinessSpareParts,
} from "@/lib/api/user/businesses";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { generateAdSlug } from "@/lib/slug";

type Props = {
  params: Promise<{ slug: string }>;
};

const parseSlugWithOptionalId = (param: string) => {
  const match = param.match(/^(.*)-([0-9a-fA-F]{24})$/);
  if (!match || !match[2]) {
    return { identifier: param.trim(), incomingSlug: param.trim(), incomingId: "" };
  }

  return {
    identifier: match[2],
    incomingSlug: match[1] || "",
    incomingId: match[2],
  };
};

const loadBusinessPageData = cache(async (identifier: string, cookieHeader: string) => {
  const headers = cookieHeader ? { Cookie: cookieHeader } : undefined;
  const business = await loadBusinessOnly(identifier, cookieHeader);

  if (!business) {
    return null;
  }

  const businessId = String(business.id || "");
  const [ads, services, spareParts] = await Promise.all([
    getBusinessAds(businessId, { headers, fetchOptions: { next: { revalidate: 60 } } }),
    getBusinessServices(businessId, { headers, fetchOptions: { next: { revalidate: 60 } } }),
    getBusinessSpareParts(businessId, { headers, fetchOptions: { next: { revalidate: 60 } } }),
  ]);

  return { business, ads, services, spareParts };
});

const loadBusinessOnly = cache(async (identifier: string, cookieHeader: string) => {
  const headers = cookieHeader ? { Cookie: cookieHeader } : undefined;
  return getBusinessById(identifier, {
    headers,
    fetchOptions: { next: { revalidate: 60 } },
  });
});

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug: rawParam } = await params;
  const parsed = parseSlugWithOptionalId(rawParam || "");
  const cookieHeader = (await cookies()).toString();
  const business = await loadBusinessOnly(parsed.identifier, cookieHeader);

  if (!business) {
    return {
      title: "Business Not Found | Esparex",
      description: "The requested business profile could not be found.",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const mainImage = business.logo || business.images?.[0] || null;
  const businessId = String(business.id || "");
  const canonicalSlug = business.slug || generateAdSlug(business.name || "");

  return {
    title: `${business.name || "Business Profile"} | Esparex`,
    description:
      business.description?.substring(0, 150) ||
      `Check out ${business.name} on Esparex`,
    alternates: {
      canonical: `https://esparex.in/business/${canonicalSlug}-${businessId}`,
    },
    openGraph: {
      title: `${business.name} | Esparex`,
      description: business.description?.substring(0, 200),
      images: mainImage ? [mainImage, ...previousImages] : previousImages,
    },
  };
}

export default async function BusinessProfilePage({ params }: Props) {
  const { slug: rawParam } = await params;
  const parsed = parseSlugWithOptionalId(rawParam || "");
  if (!parsed.identifier) {
    notFound();
  }

  const cookieHeader = (await cookies()).toString();
  const pageData = await loadBusinessPageData(parsed.identifier, cookieHeader);
  if (!pageData) {
    notFound();
  }

  const businessId = String(pageData.business.id || "");
  const canonicalSlug =
    pageData.business.slug ||
    generateAdSlug(pageData.business.name || "");
  const canonicalParam = `${canonicalSlug}-${businessId}`;

  if (rawParam !== canonicalParam) {
    permanentRedirect(`/business/${canonicalParam}`);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pageData.business.name,
    description: pageData.business.description,
    image: pageData.business.logo || pageData.business.images?.[0],
    telephone: pageData.business.mobile,
    url: `https://esparex.in/business/${canonicalParam}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSafeJsonLd(jsonLd) }}
      />
      <BusinessPublicProfile
        business={pageData.business}
        ads={pageData.ads}
        services={pageData.services}
        spareParts={pageData.spareParts}
        shareUrl={`https://esparex.in/business/${canonicalParam}`}
      />
    </>
  );
}
