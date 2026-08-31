"use client";

import Image from "next/image";
import { MapPin, ChevronDown, Menu } from "@/icons/IconRegistry";
import { DEFAULT_APP_LOCATION } from "@/types/location";

interface MobileHeaderTopBarProps {
  isMounted: boolean;
  resolvedHeaderLocation: string;
  onNavigateHome: () => void;
  onOpenLocationSelector: () => void;
  onOpenMobileDrawer: () => void;
}

export function MobileHeaderTopBar({
  isMounted,
  resolvedHeaderLocation,
  onNavigateHome,
  onOpenLocationSelector,
  onOpenMobileDrawer,
}: MobileHeaderTopBarProps) {
  const displayLocation = isMounted
    ? resolvedHeaderLocation || DEFAULT_APP_LOCATION.display
    : DEFAULT_APP_LOCATION.display;

  return (
    <div className="flex items-center px-3.5 h-10 bg-muted/40 border-b border-border/50 text-caption text-foreground-secondary gap-2">
      {/* Left Navigation Group: Hamburger Menu + Full Esparex Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="h-8 w-8 rounded-lg hover:bg-muted active:bg-muted/80 text-foreground-secondary flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Open navigation drawer"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center shrink-0 hover:opacity-80 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md py-0.5"
          aria-label="Go to Esparex Home"
        >
          <Image
            src="/icons/logo.png"
            alt="Esparex Logo"
            width={495}
            height={112}
            unoptimized
            className="h-[22px] w-auto object-contain"
          />
        </button>
      </div>

      {/* Right Location Group: Location Selector (Right-Aligned) */}
      <button
        type="button"
        onClick={onOpenLocationSelector}
        className="ml-auto flex items-center justify-end gap-1.5 flex-1 min-w-0 max-w-[180px] xs:max-w-[220px] sm:max-w-[260px] h-full text-right hover:text-primary transition-colors cursor-pointer group"
        aria-label={`Current location: ${displayLocation}. Tap to change location.`}
      >
        <MapPin className="h-4 w-4 text-primary shrink-0 group-hover:scale-105 transition-transform" />
        <span className="truncate block min-w-0 text-caption font-medium text-foreground">
          <span className={`transition-opacity duration-200 ${isMounted ? "opacity-100" : "opacity-0"}`}>
            {displayLocation}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-0.5" />
      </button>
    </div>
  );
}
