"use client";

import { useState } from "react";
import {
  Building2,
  Button,
  Card,
  CardContent,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Store,
} from "@esparex/ui";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/common/SafeImage";
import type { Business } from "@/lib/api/user/businesses";

interface BusinessHeaderCardProps {
  business: Business;
  locationLabel?: string;
  shareUrl?: string;
}

const isRenderableUserPhoto = (src: unknown): boolean => {
  if (typeof src !== "string" || !src.trim()) return false;
  const lower = src.toLowerCase();
  return !lower.includes("placehold.co") && !lower.includes("placeholder") && !lower.includes("no+image");
};

const buildWhatsappHref = (mobile: string): string =>
  `https://wa.me/${mobile.replace(/\D/g, "")}`;

export function BusinessHeaderCard({
  business,
  locationLabel,
  shareUrl,
}: BusinessHeaderCardProps) {
  const [copied, setCopied] = useState(false);
  const primaryBusinessType = business.businessTypes?.[0] || "Verified Business";

  const rawCover = business.coverImage || null;
  const rawLogo = business.logo || business.images?.[0] || null;
  const hasValidCover = isRenderableUserPhoto(rawCover);
  const hasValidLogo = isRenderableUserPhoto(rawLogo);

  const handleShare = async () => {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: business.name,
          text: business.tagline || business.description || business.name,
          url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };

  const hasContactActions = Boolean(business.whatsappNumber || business.mobile);
  const hasBothContactActions = Boolean((business.whatsappNumber || business.mobile) && business.mobile);

  return (
    <Card className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-xs bg-card">
      {/* Cover Banner */}
      <div className="relative h-20 sm:h-32 md:h-40 w-full bg-gradient-to-r from-primary/15 via-emerald-500/10 to-teal-500/15 dark:from-primary/20 dark:to-muted border-b border-border/60 overflow-hidden">
        {hasValidCover && (
          <SafeImage
            src={rawCover as string}
            alt={business.name}
            fill
            priority
            className="object-cover opacity-90"
            sizes="100vw"
          />
        )}

        {/* Share Button: Upper-Right Icon Only */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleShare}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 size-8.5 sm:size-9 rounded-full bg-card/85 hover:bg-card text-foreground backdrop-blur-md shadow-xs border border-border/60 transition-all cursor-pointer z-10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={copied ? "Link Copied!" : "Share Store"}
          title={copied ? "Link Copied!" : "Share Store"}
        >
          {copied ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <Share2 className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Profile Header Details */}
      <CardContent className="pt-0 px-3.5 sm:px-5 pb-3.5 sm:pb-4">
        <div className="flex flex-row items-center sm:items-end gap-3 sm:gap-4 -mt-7 sm:-mt-11 mb-2.5">
          {/* Business Logo Avatar with Integrated Trust/Verified Icon */}
          <div className="relative size-16 sm:size-22 shrink-0 rounded-2xl bg-card p-1 shadow-md ring-2 sm:ring-3 ring-card border border-border/80 flex items-center justify-center">
            {hasValidLogo ? (
              <SafeImage
                src={rawLogo as string}
                alt={`${business.name} logo`}
                fill
                className="object-cover rounded-xl"
                sizes="88px"
              />
            ) : (
              <div className="size-full rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="size-8 sm:size-10" />
              </div>
            )}

            {/* Trust & Verification Icon on Avatar */}
            <span
              className="absolute -bottom-1 -right-1 size-5 sm:size-6 rounded-full bg-card p-0.5 shadow-xs flex items-center justify-center ring-2 ring-card"
              title={business.status === "live" ? "Verified Partner" : "Registered Store"}
              aria-label={`Verification status: ${business.status === "live" ? "Verified Partner" : "Registered Store"}`}
            >
              <span className="size-full rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <ShieldCheck className="size-3 sm:size-3.5" />
              </span>
            </span>
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 min-w-0 text-left">
            <h1 className="text-body-lg sm:text-h3 font-bold text-foreground tracking-tight leading-snug truncate sm:whitespace-normal">
              {business.name}
            </h1>

            {business.tagline && (
              <p className="text-caption text-foreground-secondary mt-0.5 font-medium leading-relaxed truncate sm:whitespace-normal">
                {business.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 text-caption">
              <span className="inline-flex items-center gap-1 text-foreground-secondary font-medium bg-muted px-2 py-0.5 rounded-lg text-tiny shrink-0">
                <Store className="size-3 text-primary shrink-0" />
                <span>{primaryBusinessType}</span>
              </span>
              {locationLabel && (
                <span className="inline-flex items-center gap-1 text-foreground-secondary text-tiny font-medium truncate max-w-[150px] sm:max-w-none shrink min-w-0">
                  <MapPin className="size-3 text-foreground-subtle shrink-0" />
                  <span className="truncate">{locationLabel}</span>
                </span>
              )}
              {business.rating ? (
                <span className="inline-flex items-center gap-1 text-foreground font-bold text-tiny bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-lg shrink-0">
                  <Star className="size-3 fill-warning text-warning shrink-0" />
                  <span>{business.rating.toFixed(1)}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick Action Contact Buttons Row: WhatsApp & Call Store 50/50 Action Grid */}
        {hasContactActions ? (
          <div
            className={cn(
              "grid gap-2 pt-2.5 border-t border-border mt-1",
              hasBothContactActions ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {business.whatsappNumber || business.mobile ? (
              <Button
                asChild
                className="h-10 sm:h-9.5 px-3 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-caption font-semibold gap-1.5 shadow-2xs cursor-pointer w-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
              >
                <a
                  href={buildWhatsappHref(business.whatsappNumber || business.mobile!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${business.name} on WhatsApp`}
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </Button>
            ) : null}

            {business.mobile ? (
              <Button
                asChild
                className="h-10 sm:h-9.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold gap-1.5 shadow-2xs cursor-pointer w-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <a
                  href={`tel:${business.mobile}`}
                  aria-label={`Call ${business.name} store`}
                >
                  <Phone className="size-4 shrink-0" />
                  <span>Call Store</span>
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
