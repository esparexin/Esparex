"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/components/ui/utils";

interface AdCardActionsProps {
  adId: string | number;
  isSaved?: boolean;
  onToggleSave?: (adId: string | number, e: React.MouseEvent) => void;
  className?: string;
  isBusiness?: boolean;
  showBusinessBadge?: boolean;
}

export const AdCardActions = memo(function AdCardActions({
  adId,
  isSaved = false,
  onToggleSave,
  className,
  isBusiness,
  showBusinessBadge
}: AdCardActionsProps) {
  if (!onToggleSave) return null;

  return (
    <Button
      size="icon"
      variant="secondary"
      className={cn(
        "h-11 w-11 rounded-full shadow-md z-10 transition-colors",
        isBusiness && showBusinessBadge ? "right-7 md:right-9" : "right-1.5 md:right-2",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        haptics.toggle();
        onToggleSave(adId, e);
      }}
      aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={cn("h-5 w-5", isSaved ? "fill-red-500 text-red-500" : "text-gray-500")} />
    </Button>
  );
});

AdCardActions.displayName = "AdCardActions";
