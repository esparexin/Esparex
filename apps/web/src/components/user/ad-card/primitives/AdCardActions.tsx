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
        "h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md z-20 transition-colors bg-background/80 hover:bg-background backdrop-blur-sm",
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
      <Heart className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5 transition-colors", isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </Button>
  );
});

AdCardActions.displayName = "AdCardActions";
