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
}: BrowseListingCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-slate-100 rounded-xl">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FallbackIcon className="h-10 w-10 text-slate-200" />
            </div>
          )}
          <Badge className={`absolute top-2 left-2 border-0 text-[10px] ${badgeClassName}`}>
            {badgeLabel}
          </Badge>
        </div>

        <CardContent className="p-3 md:p-4 space-y-2">
          <div className={`text-sm font-bold ${priceClassName}`}>{priceLabel}</div>
          <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 leading-snug min-h-[2.5rem]">
            {title}
          </h3>
          <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-400 pt-1.5 border-t">
            {location ? (
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            ) : null}
            {createdAt ? (
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <Clock className="h-2.5 w-2.5" />
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
        </CardContent>
      </Card>
    </Link>
  );
});
