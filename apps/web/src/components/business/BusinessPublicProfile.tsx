"use client";

import { useMemo, useState } from "react";
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
  CheckCircle,
  Store,
} from "@/icons/IconRegistry";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@esparex/ui";
import { AdCardGrid } from "@/components/user/ad-card";
import { SafeImage } from "@/components/ui/SafeImage";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import type { Business, Service } from "@/lib/api/user/businesses";
import type { Ad } from "@/schemas/ad.schema";
import { LISTING_TYPE } from "@esparex/contracts";

type ListingTab = "ads" | "services" | "spare-parts";

interface BusinessPublicProfileProps {
  business: Business;
  ads: Ad[];
  services: Service[];
  spareParts: Ad[];
  shareUrl?: string;
}

const isRenderableUserPhoto = (src: unknown): boolean => {
  if (typeof src !== "string" || !src.trim()) return false;
  const lower = src.toLowerCase();
  if (lower.includes("placehold.co") || lower.includes("placeholder") || lower.includes("no+image")) return false;
  return true;
};

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

const buildWhatsappHref = (mobile: string): string =>
  `https://wa.me/${mobile.replace(/\D/g, "")}`;

export function BusinessPublicProfile({
  business,
  ads,
  services,
  spareParts,
  shareUrl,
}: BusinessPublicProfileProps) {
  const [activeTab, setActiveTab] = useState<ListingTab>("ads");
  const [shareLabel, setShareLabel] = useState("Share");
  const primaryBusinessType = business.businessTypes?.[0] || "Professional seller";

  const tabs = useMemo(() => {
    const allTabs: { key: ListingTab; label: string; count: number; icon: React.ReactNode }[] = [
      { key: "ads", label: "Listings", icon: <LayoutGrid size={14} />, count: ads.length },
      { key: "services", label: "Services", icon: <Briefcase size={14} />, count: services.length },
      {
        key: "spare-parts",
        label: "Spare Parts",
        icon: <CircuitBoard size={14} />,
        count: spareParts.length,
      },
    ];
    return allTabs.filter((tab) => tab.count > 0);
  }, [ads.length, services.length, spareParts.length]);

  const effectiveActiveTab = tabs.some((tab) => tab.key === activeTab) ? activeTab : (tabs[0]?.key || "ads");

  const activeItems: (Ad | Service)[] = useMemo(() => {
    if (effectiveActiveTab === "services") return services;
    if (effectiveActiveTab === "spare-parts") return spareParts;
    return ads;
  }, [effectiveActiveTab, ads, services, spareParts]);

  const rawCover = business.coverImage || business.images?.[0] || null;
  const rawLogo = business.logo || business.images?.[0] || null;

  const hasValidCover = isRenderableUserPhoto(rawCover);
  const hasValidLogo = isRenderableUserPhoto(rawLogo);

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
      locationLabel: business.location?.city
        ? `${business.location.city}${business.location.state ? `, ${business.location.state}` : ""}`
        : "Nearby",
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
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Hero Profile Banner Card */}
      <Card className="overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs bg-white">
        {/* Cover Banner */}
        <div className="relative h-32 md:h-44 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden">
          {hasValidCover ? (
            <SafeImage
              src={rawCover as string}
              alt={business.name}
              fill
              priority
              className="object-cover opacity-80"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12 opacity-15 pointer-events-none">
              <Building2 className="size-48 text-white -mr-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        </div>

        {/* Profile Info Header */}
        <CardContent className="pt-0 px-4 md:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 md:-mt-14 mb-4">
            {/* Business Logo Avatar */}
            <div className="relative size-20 md:size-28 shrink-0 rounded-2xl bg-white p-1 shadow-md border-2 border-white overflow-hidden flex items-center justify-center">
              {hasValidLogo ? (
                <SafeImage
                  src={rawLogo as string}
                  alt={`${business.name} logo`}
                  fill
                  className="object-cover rounded-xl"
                  sizes="112px"
                />
              ) : (
                <div className="size-full rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Building2 className="size-10 md:size-12" />
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 pt-1 sm:pt-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{business.name}</h1>
                    {business.status === "live" && (
                      <Badge className="bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-none shrink-0 inline-flex items-center gap-1">
                        <CheckCircle className="size-3" />
                        Verified Business
                      </Badge>
                    )}
                  </div>
                  {business.tagline && <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-normal">{business.tagline}</p>}

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 font-normal">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2.5 py-0.5 rounded-md">
                      <Store className="size-3.5 text-blue-600" />
                      {primaryBusinessType}
                    </span>
                    {mapData.locationLabel && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <MapPin className="size-3.5 text-slate-400" />
                        {mapData.locationLabel}
                      </span>
                    )}
                    {business.rating ? (
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold ml-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {business.rating.toFixed(1)}
                        <span className="text-slate-400 font-normal">({business.totalReviews || 0})</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 text-xs font-semibold gap-1.5 hover:bg-slate-50">
                    <Share2 className="size-3.5" />
                    {shareLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid: Left Details + Right Contact Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column: About + Listings */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* About Card */}
          {business.description ? (
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
              <CardHeader className="pb-2 pt-4 px-4 md:px-6">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">About Business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 md:px-6 pb-4">
                <p className="leading-relaxed text-sm text-slate-700 font-normal whitespace-pre-wrap">{business.description}</p>
                {business.website ? (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Globe className="size-3.5 text-slate-400 shrink-0" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate font-medium">
                      {business.website}
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Listings Tabs */}
          {tabs.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "border-blue-600 text-blue-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800 font-normal"
                    }`}
                    type="button"
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeTab === tab.key ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {activeItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
                  {activeItems.map((item, index) => {
                    const record = item as Record<string, unknown>;
                    const id = String(record.id || record._id || "");
                    return (
                      <AdCardGrid key={id} ad={item as Ad} href={buildListingHref(item)} priority={index < 4} />
                    );
                  })}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-slate-500 font-normal bg-white rounded-2xl border border-slate-200/80">
                  No {activeTab === "ads" ? "listings" : activeTab === "services" ? "services" : "spare parts"} available.
                </p>
              )}
            </div>
          ) : (
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
              <CardContent className="py-10 text-center text-sm text-slate-500 font-normal">
                This business does not have any live public listings yet.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Contact Info & Location */}
        <div className="space-y-4 md:space-y-6">
          {/* Contact Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-2 pt-4 px-4 md:px-6">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 space-y-2.5">
              {business.mobile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile</p>
                    <a href={`tel:${business.mobile}`} className="text-xs font-semibold text-slate-800 hover:text-blue-600 block truncate">
                      {business.mobile}
                    </a>
                  </div>
                </div>
              ) : null}
              {business.whatsappNumber ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="size-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp</p>
                    <a href={buildWhatsappHref(business.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-800 hover:text-green-600 block truncate">
                      {business.whatsappNumber}
                    </a>
                  </div>
                </div>
              ) : null}
              {business.email ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="size-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</p>
                    <a href={`mailto:${business.email}`} className="text-xs font-semibold text-slate-800 hover:text-red-600 truncate block">
                      {business.email}
                    </a>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
            <CardHeader className="pb-2 pt-4 px-4 md:px-6">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="size-3.5 text-slate-400" />
                Store Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 md:px-6 pb-4">
              {mapData.addressQuery ? (
                <address className="not-italic text-xs text-slate-600 leading-relaxed font-normal">
                  {business.location?.address ? <>{business.location.address}<br /></> : null}
                  {[business.location?.city, business.location?.state, business.location?.pincode].filter(Boolean).join(", ")}
                </address>
              ) : null}

              <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex h-28 flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,#eff6ff,#f8fafc)] p-4 text-center">
                  <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <MapPin className="size-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2">
                    {mapData.addressQuery || "Address details available above."}
                  </p>
                </div>
                {mapData.externalUrl ? (
                  <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3.5 py-2.5">
                    <span className="text-[11px] text-slate-500">Google Maps</span>
                    <a href={mapData.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                      Open in Maps <ExternalLink className="size-3" />
                    </a>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
