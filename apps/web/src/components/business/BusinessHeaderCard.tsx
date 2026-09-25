"use client";

import { useState } from "react";
import {
  Badge,
  Building2,
  Button,
  Card,
  CardContent,
  Check,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Store,
} from "@esparex/ui";
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

  return (
    <Card className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-xs bg-card">
      {/* Cover Banner */}
      <div className="relative h-28 sm:h-40 md:h-48 w-full bg-gradient-to-r from-primary/20 via-emerald-500/15 to-teal-500/20 dark:from-primary/25 dark:to-muted border-b border-primary/15 overflow-hidden">
        {hasValidCover ? (
          <SafeImage
            src={rawCover as string}
            alt={business.name}
            fill
            priority
            className="object-cover opacity-90"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-between px-8 opacity-10 pointer-events-none text-primary">
            <Building2 className="size-44" />
          </div>
        )}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-10 -right-10 size-60 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Profile Header Details */}
      <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3.5 -mt-10 sm:-mt-14 mb-4">
          {/* Business Logo Avatar */}
          <div className="relative size-20 sm:size-28 shrink-0 rounded-2xl bg-card p-1 shadow-md ring-4 ring-card border border-border/80 overflow-hidden flex items-center justify-center mx-auto sm:mx-0">
            {hasValidLogo ? (
              <SafeImage
                src={rawLogo as string}
                alt={`${business.name} logo`}
                fill
                className="object-cover rounded-xl"
                sizes="112px"
              />
            ) : (
              <div className="size-full rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="size-9 sm:size-12" />
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-h2 sm:text-h1 font-bold text-foreground tracking-tight">{business.name}</h1>
              <Badge
                className="bg-primary/10 text-primary border border-primary/20 text-tiny font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                aria-label={`Verification status: ${business.status === "live" ? "Verified Partner" : "Registered Store"}`}
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {business.status === "live" ? "Verified Partner" : "Registered Store"}
              </Badge>
            </div>
            {business.tagline && (
              <p className="text-body text-foreground-secondary mt-0.5 font-medium leading-relaxed">
                {business.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 text-caption">
              <span className="inline-flex items-center gap-1 text-foreground-secondary font-medium bg-muted px-2.5 py-0.5 rounded-lg text-tiny">
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

        {/* Quick Action Contact Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          {(business.whatsappNumber || business.mobile) && (
            <Button
              asChild
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-caption font-semibold gap-1.5 shadow-2xs cursor-pointer flex-1 sm:flex-initial"
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

          {business.mobile && (
            <Button
              asChild
              className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold gap-1.5 shadow-2xs cursor-pointer flex-1 sm:flex-initial"
            >
              <a href={`tel:${business.mobile}`}>
                <Phone className="size-3.5" />
                Call Store
              </a>
            </Button>
          )}

          {business.email && (
            <Button
              asChild
              variant="outline"
              className="h-9 px-3.5 rounded-xl border-border bg-card hover:bg-muted/70 hover:text-primary text-foreground text-caption font-semibold gap-1.5 cursor-pointer flex-1 sm:flex-initial"
            >
              <a href={`mailto:${business.email}`}>
                <Mail className="size-3.5" />
                Email
              </a>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleShare}
            className="w-full sm:w-auto h-9 px-3.5 rounded-xl border-border text-foreground hover:text-primary text-caption font-semibold gap-1.5 hover:bg-muted/70 cursor-pointer sm:ml-auto"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
            {copied ? "Link Copied!" : "Share Store"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
