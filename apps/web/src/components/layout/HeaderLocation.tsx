"use client";

import { ChevronDown, MapPin } from "@/icons/IconRegistry";
import { useLocationData } from "@/context/LocationContext";
import { getHeaderLocationText } from "@/lib/location/locationService";
import { useMounted } from "@/hooks/useMounted";
import { DEFAULT_APP_LOCATION } from "@/types/location";

export function HeaderLocation({ onClick }: { onClick?: () => void }) {
    const { location } = useLocationData();
    const mounted = useMounted();
    const { headerText, tooltipText } = getHeaderLocationText(location);
    // Only use the real location text after mount — pre-mount renders the static
    // placeholder so SSR HTML and the initial client render are identical, avoiding
    // a hydration mismatch when location is loaded from localStorage on the client.
    const resolvedHeaderText = mounted ? (headerText || DEFAULT_APP_LOCATION.display) : DEFAULT_APP_LOCATION.display;
    const ariaLabel = mounted && resolvedHeaderText
        ? `Current location: ${resolvedHeaderText}`
        : "Open location selector";

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-w-0 max-w-[200px] lg:max-w-[240px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-body font-medium text-foreground hover:bg-muted/70 active:bg-muted transition-colors border border-transparent hover:border-border/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer group"
            aria-label={ariaLabel}
            title={mounted ? (tooltipText || resolvedHeaderText) : DEFAULT_APP_LOCATION.display}
        >
            <MapPin className="h-4 w-4 text-primary shrink-0 transition-transform group-hover:scale-105" />
            <span className="min-w-0 flex-1 text-left leading-tight text-foreground/90 font-medium">
                <span className={`block truncate transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    {resolvedHeaderText}
                </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-colors group-hover:text-foreground" />
        </button>
    );
}
