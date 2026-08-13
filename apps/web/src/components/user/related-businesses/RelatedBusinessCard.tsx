import Link from "next/link";
import { MapPin, Wrench } from "@/icons/IconRegistry";
import type { Business } from "@/lib/api/user/businesses";
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  toSafeImageSrc,
} from "@/lib/image/imageUrl";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/SafeImage";

interface RelatedBusinessCardProps {
  business: Business;
  distanceLabel: string | null;
}

export function RelatedBusinessCard({ business, distanceLabel }: RelatedBusinessCardProps) {
  const matchingServicesCount = business.matchingServicesCount || 0;
  const activeServicesCount = business.activeServicesCount || 0;
  const locationLabel = resolveListingLocationLabel(business.location, "full") || "Nearby";
  const imageSrc = toSafeImageSrc(business.coverImage || business.images?.[0], DEFAULT_IMAGE_PLACEHOLDER);
  const businessIdentifier = (business.slug || business.id || "").toString().trim();
  const businessHref = businessIdentifier ? `/business/${encodeURIComponent(businessIdentifier)}` : "/account/business";

  return (
    <Link href={businessHref} className="block shrink-0 group">
      <Card className="w-56 md:w-60 shrink-0 border border-border shadow-2xs rounded-xl bg-card p-2.5 md:p-3 space-y-2 group-hover:border-primary/40 transition-colors">
        <div className="flex items-start gap-2.5">
          <div className="relative size-11 md:size-12 shrink-0 rounded-lg overflow-hidden bg-muted/50 border border-border">
            <SafeImage
              src={imageSrc}
              alt={business.name}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="48px"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors flex-1">
                {business.name}
              </h3>
              {business.status === "live" && (
                <Badge className="shrink-0 rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.5 text-2xs font-semibold border-none">
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-tiny text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">{locationLabel}</span>
              {distanceLabel ? <span className="shrink-0">· {distanceLabel}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap gap-1">
            {matchingServicesCount > 0 ? (
              <Badge variant="secondary" className="rounded-md bg-blue-50 px-1.5 py-0.5 text-2xs font-medium text-blue-700 border-none">
                {matchingServicesCount} matching
              </Badge>
            ) : activeServicesCount > 0 ? (
              <Badge variant="secondary" className="rounded-md bg-slate-100 px-1.5 py-0.5 text-2xs font-medium text-slate-600 border-none">
                {activeServicesCount} live
              </Badge>
            ) : null}
          </div>

          <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-md bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-2xs shrink-0 transition-colors">
            <Wrench className="mr-1 h-3 w-3" />
            View
          </span>
        </div>
      </Card>
    </Link>
  );
}
