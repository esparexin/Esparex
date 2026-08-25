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
}

export const AdCardActions = memo(function AdCardActions({
  adId,
  isSaved: propIsSaved,
  onToggleSave: propOnToggleSave,
  className,
}: AdCardActionsProps) {
  const internalFavorite = useFavoriteAd(adId, propIsSaved);

  const isSaved = propIsSaved !== undefined ? propIsSaved : internalFavorite.isSaved;
  const handleToggle = propOnToggleSave || internalFavorite.toggleSave;

  return (
    <Button
      size="icon"
      variant="secondary"
      className={cn(
        "h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-full shadow-xs z-20 transition-colors bg-background/80 hover:bg-background backdrop-blur-sm p-0 cursor-pointer",
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
      <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </Button>
  );
});

AdCardActions.displayName = "AdCardActions";
