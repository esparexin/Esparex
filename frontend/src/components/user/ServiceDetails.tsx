"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Calendar,
  Wrench,
} from "lucide-react";
import type { UserPage } from "@/lib/routeUtils";
import { Breadcrumbs } from "./Breadcrumbs";
import { BackButton } from "@/components/common/BackButton";

import { PlaceholderImage } from "../common/PlaceholderImage";
import { getServicePhone, type Service } from "@/api/user/services";
import { notify } from "@/lib/notify";
import type { User } from "@/types/User";
import { normalizeLocation as normalizeAppLocation } from "@/lib/location/locationService";
import { useServiceDetailQuery } from "@/queries";
import { formatPrice } from "@/utils/formatters";
const ServiceRelatedBusinessesSection = dynamic(
  () => import("./service-detail/ServiceRelatedBusinessesSection").then((mod) => mod.ServiceRelatedBusinessesSection),
  { ssr: false }
);
const ServiceDetailsSidebar = dynamic(
  () => import("./service-detail/ServiceDetailsSidebar").then((mod) => mod.ServiceDetailsSidebar),
  { ssr: false }
);

interface ServiceDetailsProps {
  navigateTo: (page: UserPage, adId?: number, category?: string, businessId?: string, serviceId?: string) => void;
  navigateBack: () => void;
  showBackButton?: boolean;
  serviceId?: string;
  initialService?: Service | null;
  isOwner?: boolean;
  user?: User | null;
  onShowLogin?: () => void;
}

export function ServiceDetails({
  navigateTo,
  navigateBack,
  showBackButton = true,
  serviceId,
  initialService = null,
  isOwner,
  user,
  onShowLogin,
}: ServiceDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const {
    data: service,
    isLoading: loading,
    error: serviceError,
  } = useServiceDetailQuery(serviceId ?? "", {
    enabled: !!serviceId,
    initialData: initialService,
  });

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  // Derive ownership from the loaded service when not explicitly provided
  const computedIsOwner = isOwner ?? (
    !!user &&
    !!service &&
    (typeof service.userId === "string"
      ? service.userId === user.id
      : isRecord(service.userId) && service.userId._id === user.id)
  );

  const isBusinessActive = (status?: string) =>
    typeof status === "string" && status.toLowerCase() === "live";

  const getPopulatedName = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (!isRecord(value)) return null;
    return typeof value.name === "string" ? value.name : null;
  };

  const getServiceLocation = (value: Service["location"]) => {
    const normalized = normalizeAppLocation(value);
    if (!normalized) return null;
    return {
      address: normalized.formattedAddress || "",
      city: normalized.city || "",
      state: normalized.state || "",
    };
  };

  const getServiceBusiness = (value: Service["userId"]) => {
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    return {
      businessId: typeof record.businessId === "string" ? record.businessId : undefined,
      businessName: typeof record.businessName === "string" ? record.businessName : undefined,
      businessStatus: typeof record.businessStatus === "string" ? record.businessStatus : undefined,
      avatar: typeof record.avatar === "string" ? record.avatar : undefined,
    };
  };

  const handleRevealPhone = useCallback(async () => {
    if (!serviceId) return;

    if (!user) {
      localStorage.setItem('esparex_pending_service_phone_view', String(serviceId));
      onShowLogin?.();
      return;
    }

    if (revealedPhone) return;

    setIsRevealing(true);
    try {
      const result = await getServicePhone(serviceId);
      if (result) {
        setRevealedPhone(result.mobile);
        notify.success("Phone number revealed!");
      } else {
        notify.error("Failed to reveal phone number");
      }
    } catch {
      notify.error("An error occurred");
    } finally {
      setIsRevealing(false);
    }
  }, [user, revealedPhone, serviceId, onShowLogin]);

  // Check if user just logged in to view phone number
  useEffect(() => {
    const checkPendingReveal = async () => {
      if (user && service && serviceId) {
        const pendingPhoneView = localStorage.getItem('esparex_pending_service_phone_view');
        if (pendingPhoneView === String(serviceId)) {
          localStorage.removeItem('esparex_pending_service_phone_view');
          await handleRevealPhone();
        }
      }
    };
    checkPendingReveal();
  }, [user, service, serviceId, handleRevealPhone]);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-xl font-semibold text-gray-600">
          {serviceError instanceof Error ? serviceError.message : "Service not found"}
        </p>
        <Button onClick={navigateBack}>Go Back</Button>
      </div>
    );
  }

  const images = service.images || [];
  const categoryName = getPopulatedName(service.category) || "Service";
  const business = getServiceBusiness(service.userId);
  const location = getServiceLocation(service.location) || { address: "", city: "", state: "" };

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
          {showBackButton && (
            <BackButton
              onClick={() => navigateBack()}
              className="gap-1 mb-2"
            />
          )}

          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Home", onClick: () => navigateTo("home") },
              { label: "Services", onClick: () => navigateTo("browse") },
              { label: categoryName, onClick: () => navigateTo("browse", undefined, categoryName) },
              { label: service.title },
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 pb-20 md:pb-6">
        <div className="w-full md:px-6 lg:px-8 md:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Owner status banner */}
            {computedIsOwner && service.status && service.status !== "live" && (
              <div className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-3 ${
                service.status === "pending"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : service.status === "rejected"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <span className="text-lg leading-none mt-0.5">
                  {service.status === "pending" ? "⏳" : service.status === "rejected" ? "❌" : "ℹ️"}
                </span>
                <div>
                  <p className="text-sm font-semibold capitalize">{service.status} — Not visible to customers</p>
                  {service.status === "pending" && (
                    <p className="text-xs mt-0.5">Your service is under review. We&apos;ll notify you once it&apos;s approved.</p>
                  )}
                  {service.status === "rejected" && service.rejectionReason && (
                    <p className="text-xs mt-0.5">Reason: {service.rejectionReason}</p>
                  )}
                  {service.status === "expired" && (
                    <p className="text-xs mt-0.5">This service has expired. Delete and repost to make it live again.</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6">

              {/* Left Column - Service Details */}
              <div className="lg:col-span-2 space-y-0 md:space-y-4">

                {/* Image Slider */}
                <Card className="rounded-none md:rounded-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-[16/10] bg-gray-100">
                      <PlaceholderImage
                        src={images[currentImageIndex]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                        text={service.title}
                      />

                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>

                          {/* Image Counter */}
                          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} / {images.length}
                          </div>

                          {/* Dot Indicators */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_item, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? "bg-white w-6" : "bg-white/50"
                                  }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Service Information */}
                <Card className="rounded-none md:rounded-lg">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h1 className="text-xl md:text-2xl font-bold mb-3">{service.title}</h1>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {categoryName}
                          </Badge>
                          {isBusinessActive(business?.businessStatus) && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified Business
                            </Badge>
                          )}
                          {service.onsiteService && (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                              On-site Service
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">{service.priceType ?? ""}</p>
                        <p className="text-xl md:text-2xl font-bold text-green-600 flex items-center gap-1">
                          <IndianRupee className="h-5 w-5" />
                          {service.priceMin ? formatPrice(service.priceMin).replace("₹", "") : "Quote"}
                          {service.priceMax ? ` - ${formatPrice(service.priceMax).replace("₹", "")}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Service Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 p-3 md:p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Warranty</p>
                          <p className="text-sm font-medium">{service.warranty || "No warranty"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">On-site</p>
                          <p className="text-sm font-medium">{service.onsiteService ? "Yes" : "No"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                        <Calendar className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Brand/Model</p>
                          <p className="text-sm font-medium">
                            {getPopulatedName(service.brand) ?? ""} {getPopulatedName(service.model) ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Included/Excluded */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <h3 className="font-semibold mb-1 text-sm">Included:</h3>
                        <p className="text-sm text-muted-foreground">{service.included || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 text-sm">Excluded:</h3>
                        <p className="text-sm text-muted-foreground">{service.excluded || "N/A"}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Near Service Centers Section */}
                <div className="mt-8">
                  <ServiceRelatedBusinessesSection
                    city={location.city}
                    navigateTo={navigateTo}
                  />
                </div>
              </div>

              {/* Right Column - Business Info Sidebar */}
              <ServiceDetailsSidebar
                business={business}
                location={location}
                isOwner={computedIsOwner}
                serviceId={serviceId}
                revealedPhone={revealedPhone}
                isRevealing={isRevealing}
                onRevealPhone={handleRevealPhone}
                navigateTo={navigateTo}
              />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
