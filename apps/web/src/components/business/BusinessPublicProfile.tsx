"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  CircuitBoard,
  Container,
  LayoutGrid,
  MessageCircle,
  Phone,
} from "@esparex/ui";
import { BusinessCatalogTabs, type ListingTab } from "./BusinessCatalogTabs";
import { BusinessHeaderCard } from "./BusinessHeaderCard";
import { BusinessSidebarCard } from "./BusinessSidebarCard";
import type { Business, Service } from "@/lib/api/user/businesses";
import type { Ad } from "@/schemas/ad.schema";

interface BusinessPublicProfileProps {
  business: Business;
  ads: Ad[];
  services: Service[];
  spareParts: Ad[];
  shareUrl?: string;
}

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

  const whatsappNumber = business.whatsappNumber || business.mobile;

  return (
    <Container variant="lg" className="flex flex-col gap-4 py-4 sm:py-6 pb-20 sm:pb-8">
      {/* 1. Hero Header Card */}
      <BusinessHeaderCard
        business={business}
        locationLabel={mapData.locationLabel}
        shareUrl={shareUrl}
      />

      {/* 2. Main Content Grid (Catalog + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Store Catalog Tabs */}
        <div className="lg:col-span-2">
          <BusinessCatalogTabs
            tabs={tabs}
            activeTab={activeTab}
            effectiveActiveTab={effectiveActiveTab}
            onTabChange={setActiveTab}
            activeItems={activeItems}
          />
        </div>

        {/* Right Column: About, Credentials & Map */}
        <div className="lg:col-span-1">
          <BusinessSidebarCard
            business={business}
            addressQuery={mapData.addressQuery}
            externalMapUrl={mapData.externalUrl}
          />
        </div>
      </div>

      {/* 3. Mobile Floating Contact Bar */}
      {(business.mobile || whatsappNumber) && (
        <div
          className="z-[60] sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur border-t border-border shadow-lg flex items-center gap-2"
        >
          {business.mobile && (
            <a
              href={`tel:${business.mobile}`}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-caption flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <Phone className="size-4" />
              Call Store
            </a>
          )}
          {whatsappNumber && (
            <a
              href={buildWhatsappHref(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-caption flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </Container>
  );
}
