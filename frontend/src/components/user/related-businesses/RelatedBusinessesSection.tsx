"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { getBusinesses } from "@/api/user/businesses";
import type { UserPage } from "@/lib/routeUtils";
import logger from "@/lib/logger";
import { ROUTES } from "@/lib/logic/routes";
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  toSafeImageArray,
  toSafeImageSrc,
} from "@/lib/image/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, Star, MapPin } from "lucide-react";

type RelatedBusinessCard = {
  id: string;
  slug?: string;
  businessName: string;
  city: string;
  distance: string;
  verified: boolean;
  rating: number;
  yearsExperience: string;
  totalRepairs: string;
  responseTime: string;
  services: string[];
  coverImage: string;
  shopImages: string[];
};

interface RelatedBusinessesSectionProps {
  city?: string;
  navigateTo: (
    page: UserPage,
    adId?: string | number,
    category?: string,
    sellerIdOrBusinessId?: string,
    serviceId?: string,
    sellerId?: string,
    sellerType?: "business" | "individual"
  ) => void;
}

export function RelatedBusinessesSection({
  city,
  navigateTo,
}: RelatedBusinessesSectionProps) {
  const [businesses, setBusinesses] = useState<RelatedBusinessCard[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRelatedBusinesses = async () => {
      if (!city) {
        setBusinesses([]);
        return;
      }

      try {
        const records = await getBusinesses({ city, limit: 12 });
        if (cancelled) return;

        const mapped: RelatedBusinessCard[] = records.map((business) => ({
          id: business.id,
          slug: business.slug,
          businessName: business.businessName || "",
          city: business.location.city || business.location.display || "Unknown",
          distance: "Near you",
          verified: business.verified,
          rating: 4.8,
          yearsExperience: "5+",
          totalRepairs: "500",
          responseTime: "< 1hr",
          services: business.businessTypes || [],
          coverImage: toSafeImageSrc(
            business.images?.[0],
            DEFAULT_IMAGE_PLACEHOLDER
          ),
          shopImages: toSafeImageArray(business.images),
        }));
        setBusinesses(mapped);
      } catch (error) {
        logger.error("Failed to fetch related businesses", error);
        if (!cancelled) {
          setBusinesses([]);
        }
      }
    };

    void fetchRelatedBusinesses();
    return () => {
      cancelled = true;
    };
  }, [city]);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 300;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!businesses.length) return null;

  return (
    <div className="mt-12 px-4 md:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Near Service Centers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Trusted service centers available in your area
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => scrollCarousel("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => scrollCarousel("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {businesses.map((business) => (
          <Card
            key={business.id}
            className="flex-shrink-0 w-72 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              navigateTo(ROUTES.PUBLIC_PROFILE, undefined, undefined, business.slug || business.id);
            }}
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
              <Image
                src={toSafeImageSrc(business.coverImage, DEFAULT_IMAGE_PLACEHOLDER)}
                alt={business.businessName}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
              />
              {business.verified && (
                <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  VERIFIED
                </Badge>
              )}
              {business.rating && (
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-semibold">{business.rating}</span>
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold line-clamp-1 text-base">{business.businessName}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{business.city}</span>
                  <span>•</span>
                  <span>{business.distance}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-b">
                <div className="text-center">
                  <div className="text-sm font-bold text-[#0652DD]">{business.yearsExperience}</div>
                  <div className="text-[10px] text-muted-foreground">Years</div>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-sm font-bold text-[#0652DD]">{business.totalRepairs}+</div>
                  <div className="text-[10px] text-muted-foreground">Repairs</div>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-sm font-bold text-[#0652DD]">{business.responseTime}</div>
                  <div className="text-[10px] text-muted-foreground">Response</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {business.services.slice(0, 3).map((service, index) => (
                  <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {service}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {toSafeImageArray(business.shopImages).slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-square rounded overflow-hidden bg-gray-100 relative">
                    <Image
                      src={image}
                      alt={`${business.businessName} shop ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                className="w-full bg-[#0652DD] hover:bg-[#0652DD]/90 h-9"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(ROUTES.PUBLIC_PROFILE, undefined, undefined, business.slug || business.id);
                }}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
