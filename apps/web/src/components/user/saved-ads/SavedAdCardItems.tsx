"use client";

import Image from "next/image";
import { AlertCircle, Heart, Trash2 } from "lucide-react";
import type { Ad } from "@/schemas/ad.schema";
import { toSafeImageSrc, DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

// Statuses where the ad is no longer publicly accessible
export const UNAVAILABLE_STATUSES = new Set(["deactivated", "rejected", "expired", "deleted"]);

export const isUnavailable = (ad: Ad) => UNAVAILABLE_STATUSES.has(ad.status ?? "");

export const getUnavailableLabel = (status: string): string => {
  switch (status) {
    case "deactivated": return "Deactivated";
    case "expired":     return "Expired";
    case "sold":        return "Sold";
    case "rejected":    return "Removed";
    case "deleted":     return "Deleted";
    default:            return "Unavailable";
  }
};

export function SavedAdStatusOverlay({ status }: { status?: string }) {
  return (
    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
      <Badge className="bg-gray-800 text-white text-2xs font-bold border-0 gap-1">
        <AlertCircle className="h-3 w-3" />
        {getUnavailableLabel(status ?? "")}
      </Badge>
    </div>
  );
}

export function SavedAdRemoveButton({
  unavailable,
  onClick,
  className,
  iconClassName,
}: {
  unavailable: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className: string;
  iconClassName: string;
}) {
  return (
    <Button
      size="icon"
      variant="secondary"
      className={className}
      onClick={onClick}
      title="Remove from saved"
    >
      {unavailable ? (
        <Trash2 className={`${iconClassName} text-red-500`} />
      ) : (
        <Heart className={`${iconClassName} fill-red-500 text-red-500`} />
      )}
    </Button>
  );
}

export function SavedAdTypeBadge({
  label,
  unavailable,
  className,
}: {
  label: string;
  unavailable: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={`text-2xs font-bold border-0 ${unavailable ? "bg-gray-100 text-foreground-subtle" : "bg-blue-50 text-link"} ${className ?? ""}`}
    >
      {label.toUpperCase()}
    </Badge>
  );
}

export function SavedAdImageFrame({
  ad,
  unavailable,
  containerClassName,
  imageClassName,
  imageSizes,
  removeButtonClassName,
  removeIconClassName,
  onRemove,
}: {
  ad: Ad;
  unavailable: boolean;
  containerClassName: string;
  imageClassName: string;
  imageSizes: string;
  removeButtonClassName: string;
  removeIconClassName: string;
  onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className={containerClassName}>
      <Image
        src={toSafeImageSrc(ad.images?.[0], DEFAULT_IMAGE_PLACEHOLDER)}
        alt={ad.title}
        fill
        unoptimized
        className={imageClassName}
        sizes={imageSizes}
      />
      {unavailable && <SavedAdStatusOverlay status={ad.status} />}
      <SavedAdRemoveButton
        unavailable={unavailable}
        onClick={onRemove}
        className={removeButtonClassName}
        iconClassName={removeIconClassName}
      />
    </div>
  );
}
