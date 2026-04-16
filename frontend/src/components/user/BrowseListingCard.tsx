"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatStableDate } from "@/lib/formatters";

interface BrowseListingCardProps {
  href: string;
  imageUrl: string;
  title: string;
  priceLabel: string;
  priceClassName: string;
  badgeLabel: string;
  badgeClassName: string;
  location?: string;
  createdAt?: string;
  fallbackIcon: LucideIcon;
  view?: "grid" | "list";
  priority?: boolean;
}

export const BrowseListingCard = memo(function BrowseListingCard({
  href,
  imageUrl,
  title,
  priceLabel,
  priceClassName,
  badgeLabel,
  badgeClassName,
  location,
  createdAt,
  fallbackIcon: FallbackIcon,
  view = "grid",
  priority = false,
}: BrowseListingCardProps) {
  const media = imageUrl ? (
    <Image
      src={imageUrl}
      alt={title}
      fill
      unoptimized={!imageUrl.startsWith('/')}
      priority={priority}
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      sizes={view === "list" ? "(max-width: 768px) 35vw, 180px" : "(max-width: 768px) 50vw, 33vw"}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <FallbackIcon className="h-10 w-10 text-foreground-subtle" />
    </div>
  );

  const metaRow = location || createdAt ? (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-2 border-t">
      {location ? (
        <div className="flex items-center gap-1 min-w-0">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className={view === "list" ? "break-words" : "truncate"}>{location}</span>
        </div>
      ) : null}
      {createdAt ? (
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          <span>
            {formatStableDate(createdAt, {
              day: "numeric",
              month: "short",
              year: undefined,
            })}
          </span>
        </div>
      ) : null}
    </div>
  ) : null;

  if (view === "list") {
    return (
      <Link href={href} className="block">
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border border-black rounded-xl">
          <div className="flex min-w-0 items-stretch">
            <div className="relative h-32 w-28 shrink-0 overflow-hidden bg-slate-100 sm:h-36 sm:w-32">
              {media}
              <Badge className={`absolute top-2 left-2 border-0 text-2xs ${badgeClassName}`}>
                {badgeLabel}
              </Badge>
            </div>

            <CardContent className="flex min-w-0 flex-1 flex-col justify-between p-4">
              <div className="min-w-0 space-y-2">
                <div className={`text-base font-bold ${priceClassName}`}>{priceLabel}</div>
                <h3 className="line-clamp-2 text-base font-semibold leading-tight text-foreground">
                  {title}
                </h3>
              </div>
              {metaRow}
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={href} className="block h-full">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border border-black rounded-xl">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {media}
          <Badge className={`absolute top-2 left-2 border-0 text-2xs ${badgeClassName}`}>
            {badgeLabel}
          </Badge>
        </div>

        <CardContent className="p-3 md:p-4 space-y-2">
          <div className={`text-sm font-bold ${priceClassName}`}>{priceLabel}</div>
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground leading-snug min-h-[2.5rem]">
            {title}
          </h3>
          {metaRow}
        </CardContent>
      </Card>
    </Link>
  );
});
