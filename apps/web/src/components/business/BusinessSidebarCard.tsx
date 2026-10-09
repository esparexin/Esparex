"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ExternalLink,
  Globe,
  MapPin,
} from "@esparex/ui";
import type { Business } from "@/lib/api/user/businesses";

interface BusinessSidebarCardProps {
  business: Business;
  addressQuery?: string;
  externalMapUrl?: string | null;
}

export function BusinessSidebarCard({
  business,
  addressQuery,
  externalMapUrl,
}: BusinessSidebarCardProps) {
  const hasAboutOrDetails = Boolean(
    business.description || business.website || business.gstNumber
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* About & Credentials Card */}
      {hasAboutOrDetails ? (
        <Card className="rounded-2xl border border-border shadow-sm bg-card">
          <CardHeader className="pb-1 pt-3 sm:pt-3.5 px-3.5 sm:px-5">
            <CardTitle className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider">
              About Business
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 px-3.5 sm:px-5 pb-3.5 sm:pb-4">
            {business.description ? (
              <p className="leading-relaxed text-body text-foreground-secondary font-normal whitespace-pre-wrap break-words">
                {business.description}
              </p>
            ) : null}
            {business.website ? (
              <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                <Globe className="size-3.5 text-foreground-subtle shrink-0" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-caption text-primary hover:underline truncate font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            ) : null}
            {business.gstNumber ? (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-caption">
                <span className="text-foreground-secondary font-medium">GST Registered</span>
                <span className="text-foreground font-semibold text-tiny font-mono">{business.gstNumber}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Store Location & Address */}
      <Card className="rounded-2xl border border-border shadow-sm bg-card">
        <CardHeader className="pb-1 pt-3 sm:pt-3.5 px-3.5 sm:px-5">
          <CardTitle className="text-tiny font-bold text-foreground-subtle uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="size-3.5 text-foreground-subtle shrink-0" />
            Store Location
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-3.5 sm:px-5 pb-3.5 sm:pb-4">
          {addressQuery ? (
            <address className="not-italic text-caption text-foreground-secondary leading-relaxed font-normal break-words">
              {business.location?.address ? (
                <>
                  {business.location.address}
                  <br />
                </>
              ) : null}
              {[business.location?.city, business.location?.state, business.location?.pincode]
                .filter(Boolean)
                .join(", ")}
            </address>
          ) : null}

          {externalMapUrl && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full h-10 sm:h-9 rounded-xl border-border text-caption font-semibold text-foreground-secondary hover:text-primary hover:bg-muted/60 gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <a href={externalMapUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5 shrink-0" />
                Directions in Google Maps
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
