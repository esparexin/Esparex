import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { SellerProfilePage } from "@/components/user/SellerProfilePage";
import { getUserProfile } from "@/lib/api/user/users";
import { toCanonicalUrl } from "@/lib/seo/canonicalHost";
import { generateAdSlug } from "@/lib/slug";

type SellerProfileRouteProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

const parseSellerProfileParam = (param: string): string => {
  const match = param.match(/^(.*)-([0-9a-fA-F]{24})$/);
  if (!match || !match[2]) {
    return param.trim();
  }

  return match[2];
};

const loadSellerProfile = cache(async (identifier: string) =>
  getUserProfile(identifier, {
    fetchOptions: { next: { revalidate } },
  })
);

export async function generateMetadata({
  params,
}: SellerProfileRouteProps): Promise<Metadata> {
  const { id: rawParam } = await params;
  const identifier = parseSellerProfileParam(rawParam || "");
  const profile = await loadSellerProfile(identifier);

  if (!profile) {
    return {
      title: "Seller Profile Not Found | Esparex",
      description: "The requested seller profile could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const sellerSlug = generateAdSlug(profile.user.name || "seller");
  return {
    title: `${profile.user.name || "Seller"} | Esparex`,
    description: "View seller profile and active listings on Esparex.",
    alternates: {
      canonical: toCanonicalUrl(`/seller/${sellerSlug}-${profile.user.id}`),
    },
  };
}

export default async function SellerProfileRoute({
  params,
}: SellerProfileRouteProps) {
  const { id: rawParam } = await params;
  const identifier = parseSellerProfileParam(rawParam || "");
  if (!identifier) {
    notFound();
  }

  const profile = await loadSellerProfile(identifier);

  if (!profile) {
    notFound();
  }

  const sellerSlug = generateAdSlug(profile.user.name || "seller");
  const canonicalParam = `${sellerSlug}-${profile.user.id}`;
  if (rawParam !== canonicalParam) {
    permanentRedirect(`/seller/${canonicalParam}`);
  }

  return <SellerProfilePage profile={profile} />;
}
