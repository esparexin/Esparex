import React from "react";
import { Package, Wrench, CircuitBoard, MapPin, Timer, Home, Wifi } from "@/icons/IconRegistry";
import type { Listing } from "@/lib/api/user/listings";
import type { ListingStatus } from "@/hooks/useUserListingManagement";
import { ListingItem } from "@/components/user/shared/ListingItem";
import {
  resolveListingLocationLabel,
  resolveReadableListingReferenceLabel,
} from "@/lib/listings/listingPresentation";
import { formatPrice, formatStableNumber } from "@/lib/formatters";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

export type ListingSubTab = "ads" | "services" | "spare-parts";

export const SUB_TABS: { value: ListingSubTab; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "ads", label: "Ads", icon: <Package className="h-4 w-4" />, color: "blue" },
  { value: "services", label: "Services", icon: <Wrench className="h-4 w-4" />, color: "violet" },
  { value: "spare-parts", label: "Spare Parts", icon: <CircuitBoard className="h-4 w-4" />, color: "teal" },
];

export const buildLocationMetaBadge = (location: unknown) => {
  const locationLabel = resolveListingLocationLabel(location, "brief");
  return locationLabel
    ? { label: locationLabel, icon: <MapPin className="h-3 w-3" /> }
    : null;
};

export const buildTag = (label: string | null, className?: string) => (
  label ? { label, className } : null
);

export interface ListingActionHandlers {
  onDelete: (listing: Listing) => void;
  onDeactivate: (listing: Listing) => void;
  onActivate: (listing: Listing) => void;
  onMarkSoldAd?: (listing: Listing) => void;
  onMarkSoldSpare?: (listing: Listing) => void;
  onRepostAd?: (id: string) => void;
  onRepostService?: (id: string) => void;
  onRepostSpare?: (id: string) => void;
  onBoost?: (listing: Listing) => void;
  getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
}

export function renderAdItem(
  listing: Listing,
  adsStatus: ListingStatus,
  handlers: ListingActionHandlers
) {
  return (
    <ListingItem
      title={listing.title}
      status={listing.status}
      listingType="ad"
      thumbnail={listing.images?.[0] ?? listing.image}
      priceLabel={formatPrice(listing.price)}
      badgeColor="blue"
      createdAt={listing.createdAt}
      expiresAt={listing.expiresAt}
      views={listing.views}
      likes={listing.likes}
      getStatusBadge={handlers.getStatusBadge}
      showStatusBadge={adsStatus !== listing.status}
      editHref={`/edit-ad/${listing.id}`}
      detailHref={buildPublicListingDetailRoute({
        id: listing.id,
        listingType: "ad",
        seoSlug: listing.seoSlug,
        title: listing.title,
      })}
      onDelete={() => handlers.onDelete(listing)}
      onMarkSold={() => handlers.onMarkSoldAd?.(listing)}
      onDeactivate={() => handlers.onDeactivate(listing)}
      onActivate={() => handlers.onActivate(listing)}
      onRenew={() => handlers.onRepostAd?.(listing.id)}
      onBoost={() => handlers.onBoost?.(listing)}
      isSpotlight={((listing.status as string) === "live" || (listing.status as string) === "active") && Boolean(listing.isSpotlight)}
      isBoosted={Boolean(listing.isBoosted)}
    />
  );
}

export function renderServiceItem(
  service: Listing,
  servicesStatus: ListingStatus,
  handlers: ListingActionHandlers
) {
  return (
    <ListingItem
      title={service.title}
      status={service.status}
      listingType="service"
      thumbnail={service.images?.[0]}
      priceLabel={service.priceMin ? `From ₹${formatStableNumber(service.priceMin)}` : "Price on request"}
      badgeColor="violet"
      createdAt={service.createdAt}
      getStatusBadge={handlers.getStatusBadge}
      showStatusBadge={servicesStatus !== service.status}
      editHref={`/edit-service/${service.id}`}
      detailHref={buildPublicListingDetailRoute({
        id: service.id,
        listingType: "service",
        seoSlug: service.seoSlug,
        title: service.title,
      })}
      onDelete={() => handlers.onDelete(service)}
      onRenew={() => handlers.onRepostService?.(service.id)}
      onDeactivate={() => handlers.onDeactivate(service)}
      onActivate={() => handlers.onActivate(service)}
      metaBadges={([
        buildLocationMetaBadge(service.location),
        service.onsiteService !== undefined ? {
          label: service.onsiteService ? "On-site" : "Remote",
          icon: service.onsiteService ? <Home className="h-3 w-3" /> : <Wifi className="h-3 w-3" />,
          className: service.onsiteService ? "text-green-600" : "text-muted-foreground"
        } : null,
        service.turnaroundTime ? { label: service.turnaroundTime, icon: <Timer className="h-3 w-3" /> } : null
      ].filter((v): v is NonNullable<typeof v> => v != null))}
      tags={([
        buildTag(
          resolveReadableListingReferenceLabel(service.category),
          "bg-violet-50 text-violet-700 border-violet-100"
        ),
        buildTag(resolveReadableListingReferenceLabel(service.brand))
      ].filter((v): v is NonNullable<typeof v> => v != null))}
    />
  );
}

export function renderSpareItem(
  listing: Listing,
  spareStatus: ListingStatus,
  handlers: ListingActionHandlers
) {
  return (
    <ListingItem
      title={listing.title}
      status={listing.status}
      listingType="spare_part"
      thumbnail={listing.images?.[0]}
      priceLabel={`₹${formatStableNumber(listing.price)}`}
      badgeColor="teal"
      createdAt={listing.createdAt}
      getStatusBadge={handlers.getStatusBadge}
      showStatusBadge={spareStatus !== listing.status}
      editHref={`/edit-spare-part/${listing.id}`}
      detailHref={buildPublicListingDetailRoute({
        id: listing.id,
        listingType: "spare_part",
        seoSlug: listing.seoSlug,
        title: listing.title,
      })}
      onDelete={() => handlers.onDelete(listing)}
      onRenew={() => handlers.onRepostSpare?.(listing.id)}
      onDeactivate={() => handlers.onDeactivate(listing)}
      onActivate={() => handlers.onActivate(listing)}
      onMarkSold={() => handlers.onMarkSoldSpare?.(listing)}
      metaBadges={([
        buildLocationMetaBadge(listing.location)
      ].filter((v): v is NonNullable<typeof v> => v != null))}
    />
  );
}
