"use client";

import Image from "next/image";
import { MapPin, ChevronDown } from "@/icons/IconRegistry";
import { DEFAULT_APP_LOCATION } from "@/types/location";

interface MobileHeaderTopBarProps {
  isMounted: boolean;
  resolvedHeaderLocation: string;
  onNavigateHome: () => void;
  onOpenLocationSelector: () => void;
}

export function MobileHeaderTopBar({
  isMounted,
  resolvedHeaderLocation,
  onNavigateHome,
  onOpenLocationSelector,
}: MobileHeaderTopBarProps) {
  const displayLocation = isMounted
    ? resolvedHeaderLocation || DEFAULT_APP_LOCATION.display
    : DEFAULT_APP_LOCATION.display;

  return (
    <div className="flex items-center px-3.5 h-10 bg-muted/40 border-b border-border/50 text-caption text-foreground-secondary gap-2">
      <button
        type="button"
        onClick={onNavigateHome}
        className="flex items-center shrink-0 hover:opacity-80 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-0.5"
        aria-label="Go to Esparex Home"
      >
        <Image
          src="/icons/brand-mark.png"
          alt="Esparex Home"
          width={48}
          height={48}
          className="h-6 w-6 rounded-md object-contain"
        />
      </button>
      <div className="h-4 w-px bg-border/60 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={onOpenLocationSelector}
        className="flex items-center justify-between min-w-0 flex-1 h-full text-left hover:text-primary transition-colors cursor-pointer group"
        aria-label={`Current location: ${displayLocation}. Tap to change location.`}
      >
        <div className="flex items-center min-w-0 flex-1 gap-1.5">
          <MapPin className="h-4 w-4 text-primary shrink-0 group-hover:scale-105 transition-transform" />
          <span className="truncate text-caption font-medium text-foreground">
            <span className={`transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}>
              {displayLocation}
            </span>
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
      </button>
    </div>
  );
}
