"use client";

import Image from "next/image";
import {
  Building2,
  CheckCircle,
  Clock,
  Edit2,
  Eye,
  Info,
  MapPin,
  MapPinIcon,
  MessageCircle,
  Phone,
  Star,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserPage } from "@/lib/routeUtils";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import { formatLocationDisplay } from "@/lib/location/locationService";
import { SellerIdentityPanel } from "../shared/SellerIdentityPanel";

type ServiceBusiness = {
  businessId?: string;
  businessName?: string;
  businessStatus?: string;
  avatar?: string;
} | null;

type ServiceLocation = {
  address: string;
  city: string;
  state: string;
};

interface ServiceDetailsSidebarProps {
  business: ServiceBusiness;
  location: ServiceLocation;
  isOwner?: boolean;
  serviceId?: string;
  revealedPhone: string | null;
  isRevealing: boolean;
  onRevealPhone: () => void | Promise<void>;
  onDeleteService?: () => void;
  navigateTo: (
    page: UserPage,
    adId?: number,
    category?: string,
    businessId?: string,
    serviceId?: string
  ) => void;
}

const isBusinessActive = (status?: string) =>
  typeof status === "string" && status.toLowerCase() === "live";

export function ServiceDetailsSidebar({
  business,
  location,
  isOwner,
  serviceId,
  revealedPhone,
  isRevealing,
  onRevealPhone,
  onDeleteService,
  navigateTo,
}: ServiceDetailsSidebarProps) {
  const locationDisplay = formatLocationDisplay({
    display: location.address,
    city: location.city,
    state: location.state,
  });

  return (
    <>
      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-4">
          <Card className="rounded-none md:rounded-lg">
            <CardContent className="p-4 md:p-6">
              <h2 className="font-bold mb-4 pb-3 border-b">Contact Here</h2>

              <div className="mb-4 pb-4 border-b">
                <SellerIdentityPanel
                  onClick={() => {
                    if (!business?.businessId) return;
                    navigateTo("public-profile", undefined, undefined, business.businessId);
                  }}
                  className="hover:bg-gray-50 rounded-lg p-2 -m-2"
                  name={business?.businessName || "Business"}
                  avatar={(
                    <div className="w-14 h-14 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      {business?.avatar ? (
                        <Image
                          src={toSafeImageSrc(business.avatar, DEFAULT_IMAGE_PLACEHOLDER)}
                          alt={business.businessName || "Business"}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <Building2 className="h-7 w-7 text-white" />
                      )}
                    </div>
                  )}
                  badge={
                    isBusinessActive(business?.businessStatus) ? (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : undefined
                  }
                  meta={(
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">4.8</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1 font-medium">View business profile →</p>
                    </>
                  )}
                />
              </div>

              <div className="mb-4 pb-4 border-b">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm">{locationDisplay || location.address}</p>
                    {location.city || location.state ? (
                      <p className="text-xs text-muted-foreground">
                        {formatLocationDisplay({ city: location.city, state: location.state })}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs gap-2">
                  <MapPinIcon className="h-3 w-3" />
                  View on Map
                </Button>
              </div>

              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <h4 className="font-semibold text-sm">Business Hours</h4>
                </div>
                <p className="text-sm mb-1">10:00 AM - 08:00 PM</p>
                <p className="text-xs text-green-600 font-medium">Open Now</p>
              </div>

              {!isOwner ? (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    onClick={onRevealPhone}
                    disabled={isRevealing}
                  >
                    {isRevealing ? "📞 Showing..." : revealedPhone ? `📞 ${revealedPhone}` : "📞 Show number"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-green-600 text-green-600 hover:bg-green-50"
                    onClick={onRevealPhone}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {revealedPhone ? "Chat on WhatsApp" : "Reveal WhatsApp"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Your Service</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 justify-start"
                    onClick={() =>
                      serviceId &&
                      navigateTo("post-service", undefined, undefined, undefined, serviceId)
                    }
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Service
                  </Button>
                  <Button variant="outline" className="w-full gap-2 justify-start">
                    <Eye className="h-4 w-4" />
                    View Analytics
                  </Button>
                  <Button className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <TrendingUp className="h-4 w-4" />
                    Promote Service
                  </Button>
                  {onDeleteService && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={onDeleteService}
                    >
                      Delete Service
                    </Button>
                  )}
                </div>
              )}

              {!isOwner && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-900">
                    <strong>Safety:</strong> Always verify service quality. No advance payments required.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {!isOwner && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{business?.businessName || "Business"}</h3>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">4.8</span>
                {isBusinessActive(business?.businessStatus) && (
                  <CheckCircle className="h-3 w-3 text-blue-600 ml-1" />
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={onRevealPhone} disabled={isRevealing}>
              <Phone className="h-4 w-4" />
              {revealedPhone ? "Call" : "Reveal"}
            </Button>
            <Button variant="outline" className="gap-2 border-green-600 text-green-600" onClick={onRevealPhone}>
              <MessageCircle className="h-4 w-4" />
              {revealedPhone ? "Chat" : "WhatsApp"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
