"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Briefcase,
  CircuitBoard,
  ExternalLink,
  Globe,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  Share2,
  Star,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AdCardGrid } from "@/components/user/ad-card";
import { PlaceholderImage } from "@/components/common/PlaceholderImage";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import type { Business, Service } from "@/lib/api/user/businesses";
import type { Ad } from "@/schemas/ad.schema";
import { LISTING_TYPE } from "@shared/enums/listingType";

type ListingTab = "ads" | "services" | "spare-parts";

interface BusinessPublicProfileProps {
  business: Business;
  ads: Ad[];
  services: Service[];
  spareParts: Ad[];
  shareUrl?: string;
}

const buildListingHref = (item: Ad | Service): string => {
  const record = item as Record<string, unknown>;
  const id = String(record.id || record._id || "");
  if (!id) return "/search";
  return buildPublicListingDetailRoute({
    id,
    listingType: record.listingType || LISTING_TYPE.AD,
    seoSlug: String(record.seoSlug || ""),
    title: String(record.title || "listing"),
  });
};

const buildWhatsappHref = (phone: string): string =>
  `https://wa.me/${phone.replace(/\D/g, "")}`;

export function BusinessPublicProfile({
  business,
  ads,
  services,
  spareParts,
  shareUrl,
}: BusinessPublicProfileProps) {
  const [activeTab, setActiveTab] = useState<ListingTab>("ads");
  const [shareLabel, setShareLabel] = useState("Share");

  const tabs = useMemo(() => {
    const allTabs: { key: ListingTab; label: string; count: number; icon: React.ReactNode }[] = [
      { key: "ads", label: "Listings", icon: <LayoutGrid size={15} />, count: ads.length },
      { key: "services", label: "Services", icon: <Briefcase size={15} />, count: services.length },
      {
        key: "spare-parts",
        label: "Spare Parts",
        icon: <CircuitBoard size={15} />,
        count: spareParts.length,
      },
    ];
    return allTabs.filter((tab) => tab.count > 0);
  }, [ads.length, services.length, spareParts.length]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeTab) && tabs[0]) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  const activeItems: (Ad | Service)[] = useMemo(() => {
    if (activeTab === "services") return services;
    if (activeTab === "spare-parts") return spareParts;
    return ads;
  }, [activeTab, ads, services, spareParts]);

  const heroImage = business.coverImage || business.images?.[0] || business.logo || null;
  const logoImage = business.logo || business.images?.[0] || business.coverImage || null;

  const mapData = useMemo(() => {
    const locationRecord =
      business.location && typeof business.location === "object"
        ? (business.location as unknown as Record<string, unknown>)
        : null;
    const point =
      locationRecord?.coordinates && typeof locationRecord.coordinates === "object"
        ? (locationRecord.coordinates as Record<string, unknown>)
        : null;
    const rawCoordinates = Array.isArray(point?.coordinates) ? point.coordinates : null;

    const lng = rawCoordinates && rawCoordinates.length === 2 ? Number(rawCoordinates[0]) : NaN;
    const lat = rawCoordinates && rawCoordinates.length === 2 ? Number(rawCoordinates[1]) : NaN;
    const hasCoordinates = Number.isFinite(lng) && Number.isFinite(lat);

    const addressParts = [
      business.location?.address,
      business.location?.city,
      business.location?.state,
      business.location?.pincode,
    ].filter(Boolean);
    const addressQuery = addressParts.join(", ");

    return {
      addressQuery,
      externalUrl: hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`
        : addressQuery
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
          : null,
    };
  }, [business]);

  const handleShare = async () => {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!url) return;

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: business.businessName,
          text: business.tagline || business.description || business.businessName,
          url,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied");
        window.setTimeout(() => setShareLabel("Share"), 1800);
      }
    } catch {
      setShareLabel("Share");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="overflow-hidden">
        <div className="relative h-32">
          <PlaceholderImage
            src={heroImage}
            alt={business.businessName}
            containerClassName="h-32 w-full rounded-none"
            className="object-cover"
            text="Business cover"
            fallbackIcon={<Building2 className="h-10 w-10 opacity-50" />}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/55 via-blue-900/35 to-blue-700/25" />
        </div>
        <CardContent className="pt-0">
          <div className="relative mt-[-60px] grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="w-fit rounded-2xl bg-white p-3 shadow-md">
                <div className="h-24 w-24 overflow-hidden rounded-xl">
                  <PlaceholderImage
                    src={logoImage}
                    alt={`${business.businessName} logo`}
                    containerClassName="h-24 w-24 rounded-xl"
                    className="object-cover"
                    text="Logo"
                    fallbackIcon={<Building2 className="h-12 w-12 text-blue-600" />}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 md:col-span-2">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{business.businessName}</h1>
                  <p className="text-lg text-muted-foreground">{business.tagline}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-1 h-4 w-4" />
                  {shareLabel}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{business.businessType}</Badge>
                {business.verified ? (
                  <Badge className="bg-green-100 text-green-800">Verified Business</Badge>
                ) : null}
              </div>

              {business.rating ? (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>
                    {business.rating.toFixed(1)} ({business.totalReviews || 0} reviews)
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {business.description ? (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-muted-foreground">{business.description}</p>
            {business.website ? (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {business.website}
                </a>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reach out using the channel that works best for you.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {business.contactNumber ? (
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${business.contactNumber}`} className="font-semibold hover:text-blue-600">
                    {business.contactNumber}
                  </a>
                </div>
              </div>
            ) : null}

            {business.whatsappNumber ? (
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <a
                    href={buildWhatsappHref(business.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:text-green-600"
                  >
                    {business.whatsappNumber}
                  </a>
                </div>
              </div>
            ) : null}

            {business.email ? (
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${business.email}`} className="font-semibold hover:text-red-600">
                    {business.email}
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mapData.addressQuery ? (
            <address className="not-italic text-sm text-muted-foreground">
              {business.location?.address ? <>{business.location.address}<br /></> : null}
              {[business.location?.city, business.location?.state, business.location?.pincode]
                .filter(Boolean)
                .join(", ")}
            </address>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex h-64 flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] px-6 text-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Open business location in maps</p>
                <p className="text-sm text-muted-foreground">
                  {mapData.addressQuery || "Address details are available above."}
                </p>
              </div>
            </div>

            {mapData.externalUrl ? (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
                <p className="text-sm text-muted-foreground">Open the full map in a new tab.</p>
                <a
                  href={mapData.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  Open in Maps <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {tabs.length > 0 ? (
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
                type="button"
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {activeItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
              {activeItems.map((item, index) => {
                const record = item as Record<string, unknown>;
                const id = String(record.id || record._id || "");
                return (
                  <AdCardGrid
                    key={id}
                    ad={item as Ad}
                    href={buildListingHref(item)}
                    priority={index < 4}
                  />
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No {activeTab === "ads" ? "listings" : activeTab === "services" ? "services" : "spare parts"} available.
            </p>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            This business does not have any live public listings yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
