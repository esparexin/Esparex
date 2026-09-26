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
          className="absolute top-2 right-2 sm:top-3 sm:right-3 size-7.5 sm:size-8.5 rounded-full bg-card/85 hover:bg-card text-foreground backdrop-blur-md shadow-xs border border-border/60 transition-all cursor-pointer z-10"
          aria-label="Share Store"
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
      <CardContent className="pt-0 px-3.5 sm:px-5 pb-3 sm:pb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-8 sm:-mt-11 mb-2.5">
          {/* Business Logo Avatar with Integrated Trust/Verified Icon */}
          <div className="relative size-16 sm:size-22 shrink-0 rounded-2xl bg-card p-1 shadow-md ring-3 ring-card border border-border/80 flex items-center justify-center mx-auto sm:mx-0">
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
              className="absolute -bottom-1 -right-1 size-5 sm:size-6 rounded-full bg-card p-0.5 shadow-xs flex items-center justify-center"
              title={business.status === "live" ? "Verified Partner" : "Registered Store"}
              aria-label={`Verification status: ${business.status === "live" ? "Verified Partner" : "Registered Store"}`}
            >
              <span className="size-full rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <ShieldCheck className="size-3 sm:size-3.5" />
              </span>
            </span>
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-body-lg sm:text-h3 font-bold text-foreground tracking-tight leading-snug">
              {business.name}
            </h1>

            {business.tagline && (
              <p className="text-caption text-foreground-secondary mt-0.5 font-medium leading-relaxed">
                {business.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-1.5 text-caption">
              <span className="inline-flex items-center gap-1 text-foreground-secondary font-medium bg-muted px-2 py-0.5 rounded-lg text-tiny">
                <Store className="size-3 text-primary" />
                {primaryBusinessType}
              </span>
              {locationLabel && (
                <span className="inline-flex items-center gap-1 text-foreground-secondary text-tiny font-medium">
                  <MapPin className="size-3 text-foreground-subtle" />
                  {locationLabel}
                </span>
              )}
              {business.rating ? (
                <span className="inline-flex items-center gap-1 text-foreground font-bold text-tiny bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {business.rating.toFixed(1)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Quick Action Contact Buttons Row: WhatsApp & Call Store 50/50 Action Grid */}
        {hasContactActions ? (
          <div
            className={cn(
              "grid gap-2 pt-2.5 border-t border-border",
              hasBothContactActions ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {business.whatsappNumber || business.mobile ? (
              <Button
                asChild
                className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-caption font-semibold gap-1.5 shadow-2xs cursor-pointer w-full flex items-center justify-center"
              >
                <a
                  href={buildWhatsappHref(business.whatsappNumber || business.mobile!)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-3.5 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </Button>
            ) : null}

            {business.mobile ? (
              <Button
                asChild
                className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold gap-1.5 shadow-2xs cursor-pointer w-full flex items-center justify-center"
              >
                <a href={`tel:${business.mobile}`}>
                  <Phone className="size-3.5 shrink-0" />
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
