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
  const primaryBusinessType = business.businessTypes[0] || "Professional seller";

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
          title: business.name,
          text: business.tagline || business.description || business.name,
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
    <div className="space-y-4 p-4 md:p-6">
      {/* Hero Card */}
      <Card className="overflow-hidden rounded-2xl border-none shadow-sm">
        <div className="relative h-28 md:h-36">
          <PlaceholderImage
            src={heroImage}
            alt={business.name}
            containerClassName="h-28 md:h-36 w-full rounded-none"
            className="object-cover"
            text="Business cover"
            fallbackIcon={<Building2 className="h-10 w-10 opacity-50" />}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-blue-950/40 to-blue-800/20" />
        </div>
        <CardContent className="pt-0 px-4 md:px-6 pb-5">
          <div className="relative mt-[-48px] md:mt-[-60px] grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="w-fit rounded-2xl bg-white p-2 shadow-md mx-0">
                <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-xl">
                  <PlaceholderImage
                    src={logoImage}
                    alt={`${business.name} logo`}
                    containerClassName="h-20 w-20 md:h-24 md:w-24 rounded-xl"
                    className="object-cover"
                    text="Logo"
                    fallbackIcon={<Building2 className="h-10 w-10 text-blue-600" />}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 md:pt-6 md:col-span-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{business.name}</h1>
                  {business.tagline && <p className="text-sm text-slate-400 mt-0.5">{business.tagline}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={handleShare} className="h-11 rounded-xl border-slate-200 text-slate-600 text-xs w-fit">
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  {shareLabel}
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-600 border-none text-xs">{primaryBusinessType}</Badge>
                {business.isVerified ? (
                  <Badge className="bg-blue-50 text-blue-700 border-none rounded-lg text-xs">Verified Business</Badge>
                ) : null}
              </div>

              {business.rating ? (
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-slate-700">{business.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({business.totalReviews || 0} reviews)</span>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      {business.description ? (
        <Card className="rounded-2xl border-slate-100 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4 md:px-6">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 md:px-6 pb-4">
            <p className="leading-relaxed text-sm text-slate-500">{business.description}</p>
            {business.website ? (
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                  {business.website}
                </a>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Separator className="bg-slate-100" />

      {/* Contact */}
      <Card className="rounded-2xl border-slate-100 shadow-none">
        <CardHeader className="pb-2 pt-4 px-4 md:px-6">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide">Contact</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {business.mobile ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Phone</p>
                  <a href={`tel:${business.mobile}`} className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                    {business.mobile}
                  </a>
                </div>
              </div>
            ) : null}
            {business.whatsappNumber ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">WhatsApp</p>
                  <a href={buildWhatsappHref(business.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-800 hover:text-green-600">
                    {business.whatsappNumber}
                  </a>
                </div>
              </div>
            ) : null}
            {business.email ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Email</p>
                  <a href={`mailto:${business.email}`} className="text-sm font-semibold text-slate-800 hover:text-red-600 truncate block">
                    {business.email}
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="rounded-2xl border-slate-100 shadow-none">
        <CardHeader className="pb-2 pt-4 px-4 md:px-6">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 md:px-6 pb-4">
          {mapData.addressQuery ? (
            <address className="not-italic text-sm text-slate-500">
              {business.location?.address ? <>{business.location.address}<br /></> : null}
              {[business.location?.city, business.location?.state, business.location?.pincode].filter(Boolean).join(", ")}
            </address>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <div className="flex h-48 flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] px-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {mapData.addressQuery || "Address details are available above."}
              </p>
            </div>
            {mapData.externalUrl ? (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">View on Google Maps</p>
                <a href={mapData.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                  Open in Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Listings Tabs */}
      {tabs.length > 0 ? (
        <div className="space-y-3">
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px flex min-h-[44px] items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                type="button"
              >
                {tab.icon}
                {tab.label}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {activeItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
              {activeItems.map((item, index) => {
                const record = item as Record<string, unknown>;
                const id = String(record.id || record._id || "");
                return (
                  <AdCardGrid key={id} ad={item as Ad} href={buildListingHref(item)} priority={index < 4} />
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
        <Card className="rounded-2xl border-slate-100 shadow-none">
          <CardContent className="py-12 text-center text-sm text-slate-400">
            This business does not have any live public listings yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
