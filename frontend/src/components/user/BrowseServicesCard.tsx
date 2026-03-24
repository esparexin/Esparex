"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Wrench } from "lucide-react";

import type { Service } from "@/api/user/services";
import { formatPrice, formatStableDate } from "@/utils/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const BrowseServicesCard = memo(function BrowseServicesCard({ service }: { service: Service }) {
  const imageUrl = toSafeImageSrc(service.images?.[0], "");
  const location =
    typeof service.location === "object"
      ? service.location?.city ?? ""
      : String(service.location ?? "");

  const displayPrice =
    service.priceMin && service.priceMax
      ? `${formatPrice(service.priceMin)} – ${formatPrice(service.priceMax)}`
      : service.price
        ? formatPrice(service.price)
        : "Contact for price";

  return (
    <Link href={`/services/${service.seoSlug || service.id}`} className="block h-full">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-slate-100 rounded-xl">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={service.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Wrench className="h-10 w-10 text-slate-200" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-0 text-[10px]">
            SERVICE
          </Badge>
        </div>

        <CardContent className="p-3 md:p-4 space-y-2">
          <div className="text-sm font-bold text-blue-600">{displayPrice}</div>
          <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 leading-snug min-h-[2.5rem]">
            {service.title}
          </h3>
          <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-400 pt-1.5 border-t">
            {location && (
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {service.createdAt && (
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <Clock className="h-2.5 w-2.5" />
                <span>
                  {formatStableDate(service.createdAt, {
                    day: "numeric",
                    month: "short",
                    year: undefined,
                  })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
