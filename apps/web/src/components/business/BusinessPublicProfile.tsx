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
  MessageCircle,
} from "@/icons/IconRegistry";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, Container } from "@esparex/ui";
import { SafeImage } from "@/components/ui/SafeImage";
import { BusinessCatalogTabs } from "./BusinessCatalogTabs";
import type { ListingTab } from "./BusinessCatalogTabs";
import type { Business, Service } from "@/lib/api/user/businesses";
import type { Ad } from "@/schemas/ad.schema";

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

  // Only use coverImage if explicitly set on business doc (do NOT duplicate logo into cover)
  const rawCover = business.coverImage || null;
  const rawLogo = business.logo || business.images?.[0] || null;

  const hasValidCover = isRenderableUserPhoto(rawCover);
  const hasValidLogo = isRenderableUserPhoto(rawLogo);

  const mapData = useMemo(() => {
    const rawLocation: unknown = business.location;
    const locationRecord =
      business.location && typeof business.location === "object"
        ? (rawLocation as Record<string, unknown>)
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
        setShareLabel("Copied!");
        window.setTimeout(() => setShareLabel("Share"), 1800);
      }
    } catch {
      setShareLabel("Share");
    }
  };

  return (
    <Container variant="lg" className="flex flex-col gap-4 py-4 sm:py-6">
      {/* Business Header Card */}
      <Card className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-2xs bg-card">
        {/* Cover Banner */}
        <div className="relative h-24 sm:h-36 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 overflow-hidden">
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
            <div className="absolute inset-0 flex items-center justify-between px-6 opacity-10 pointer-events-none">
              <Building2 className="size-36 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Profile Info Header */}
        <CardContent className="pt-0 px-3.5 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-8 sm:-mt-12 mb-3">
            {/* Business Logo Avatar */}
            <div className="relative size-16 sm:size-24 shrink-0 rounded-2xl bg-card p-1 shadow-md border-2 border-background overflow-hidden flex items-center justify-center">
              {hasValidLogo ? (
                <SafeImage
                  src={rawLogo as string}
                  alt={`${business.name} logo`}
                  fill
                  className="object-cover rounded-xl"
                  sizes="96px"
                />
              ) : (
                <div className="size-full rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="size-8 sm:size-10" />
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 pt-0.5 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h1 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">{business.name}</h1>
                    {business.status === "live" && (
                      <Badge className="bg-primary text-primary-foreground text-tiny font-semibold px-2 py-0.5 rounded-full border-none shrink-0 inline-flex items-center gap-1">
                        <CheckCircle className="size-2.5 sm:size-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {business.tagline && <p className="text-caption text-foreground-subtle mt-0.5 font-normal">{business.tagline}</p>}

                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-caption text-foreground-subtle font-normal">
                    <span className="inline-flex items-center gap-1 text-foreground-secondary font-medium bg-muted px-2 py-0.5 rounded-md text-tiny">
                      <Store className="size-3 text-primary" />
                      {primaryBusinessType}
                    </span>
                    {mapData.locationLabel && (
                      <span className="inline-flex items-center gap-1 text-foreground-subtle text-tiny">
                        <MapPin className="size-3 text-foreground-subtle" />
                        {mapData.locationLabel}
                      </span>
                    )}
                    {business.rating ? (
                      <span className="inline-flex items-center gap-1 text-foreground-secondary font-semibold text-tiny">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {business.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Contact Buttons Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
            {business.mobile && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-caption font-semibold gap-1.5 w-full"
              >
                <a href={`tel:${business.mobile}`}>
                  <Phone className="size-3.5" />
                  Call
                </a>
              </Button>
            )}

            {(business.whatsappNumber || business.mobile) && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 text-caption font-semibold gap-1.5 w-full"
              >
                <a
                  href={buildWhatsappHref(business.whatsappNumber || business.mobile!)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              </Button>
            )}

            {business.email && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-border bg-muted/50 hover:bg-muted text-foreground-secondary text-caption font-semibold gap-1.5 w-full"
              >
                <a href={`mailto:${business.email}`}>
                  <Mail className="size-3.5" />
                  Email
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 rounded-xl border-border text-foreground-secondary text-caption font-semibold gap-1.5 w-full hover:bg-muted/50"
            >
              <Share2 className="size-3.5" />
              {shareLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left Column: About + Listings */}
        <div className="lg:col-span-2 flex flex-col gap-3 sm:gap-4">
          {/* About Card */}
          {business.description ? (
            <Card className="rounded-2xl border-border shadow-2xs bg-card">
              <CardHeader className="pb-1.5 pt-3.5 px-3.5 sm:px-5">
                <CardTitle className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider">About Business</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 px-3.5 sm:px-5 pb-3.5">
                <p className="leading-relaxed text-caption sm:text-body text-foreground-secondary font-normal whitespace-pre-wrap">{business.description}</p>
                {business.website ? (
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/60">
                    <Globe className="size-3.5 text-foreground-subtle shrink-0" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-caption text-primary hover:underline truncate font-medium">
                      {business.website}
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Listings Tabs Section */}
          <BusinessCatalogTabs
            tabs={tabs}
            activeTab={activeTab}
            effectiveActiveTab={effectiveActiveTab}
            onTabChange={setActiveTab}
            activeItems={activeItems}
          />
        </div>

        {/* Right Sidebar: Location & Address */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Card className="rounded-2xl border-border shadow-2xs bg-card">
            <CardHeader className="pb-1.5 pt-3.5 px-3.5 sm:px-5">
              <CardTitle className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="size-3.5 text-foreground-subtle" />
                Store Location & Address
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 px-3.5 sm:px-5 pb-3.5">
              {mapData.addressQuery ? (
                <address className="not-italic text-caption text-foreground-secondary leading-relaxed font-normal">
                  {business.location?.address ? <>{business.location.address}<br /></> : null}
                  {[business.location?.city, business.location?.state, business.location?.pincode].filter(Boolean).join(", ")}
                </address>
              ) : null}

              <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
                <div className="flex h-24 flex-col items-center justify-center gap-1.5 p-3 text-center bg-muted/30">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="size-4" />
                  </div>
                  <p className="text-caption font-medium text-foreground-secondary line-clamp-2">
                    {mapData.addressQuery || "Address details available above."}
                  </p>
                </div>
                {mapData.externalUrl ? (
                  <div className="flex items-center justify-between border-t border-border bg-card px-3 py-2">
                    <span className="text-tiny text-foreground-subtle">Google Maps</span>
                    <a href={mapData.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
                      Open in Maps <ExternalLink className="size-3" />
                    </a>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
