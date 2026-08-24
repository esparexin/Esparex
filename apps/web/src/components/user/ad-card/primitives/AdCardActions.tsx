"use client";

import { memo } from "react";
import { Button } from "@esparex/ui";
import { Heart } from "@/icons/IconRegistry";
import { haptics } from "@/lib/haptics";
import { cn } from "@/components/ui/utils";
import { useFavoriteAd } from "@/hooks/listings/useFavoriteAd";

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
  isSaved: propIsSaved,
  onToggleSave: propOnToggleSave,
  className,
  isBusiness,
  showBusinessBadge,
}: AdCardActionsProps) {
  const internalFavorite = useFavoriteAd(adId, propIsSaved);

  const isSaved = propIsSaved !== undefined ? propIsSaved : internalFavorite.isSaved;
  const handleToggle = propOnToggleSave || internalFavorite.toggleSave;

  return (
    <Button
      size="icon"
      variant="secondary"
      className={cn(
        "h-10 w-10 sm:h-11 sm:w-11 rounded-full shadow-md z-10 transition-colors bg-background/80 hover:bg-background backdrop-blur-sm",
        isBusiness && showBusinessBadge ? "right-7 md:right-9" : "right-1.5 md:right-2",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        haptics.toggle();
        void handleToggle(adId, e);
      }}
      aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5 transition-colors", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </Button>
  );
});

AdCardActions.displayName = "AdCardActions";
