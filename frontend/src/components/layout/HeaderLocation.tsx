"use client";


import { MapPin } from "lucide-react";
import { useLocationState } from "@/context/LocationContext";
import { getHeaderLocationText } from "@/lib/location/locationService";
import { useMounted } from "@/hooks/useMounted";

export function HeaderLocation({ onClick }: { onClick?: () => void }) {
    const { location } = useLocationState();
    const mounted = useMounted();
    const { headerText, tooltipText } = getHeaderLocationText(location);
    // Only use the real location text after mount — pre-mount renders the static
    // placeholder so SSR HTML and the initial client render are identical, avoiding
    // a hydration mismatch when location is loaded from localStorage on the client.
    const resolvedHeaderText = mounted ? (headerText || "India") : "India";
    const ariaLabel = mounted && resolvedHeaderText
        ? `Current location: ${resolvedHeaderText}`
        : "Open location selector";

    return (
        <button
            onClick={onClick}
            className="flex min-w-0 items-center gap-1.5 rounded-md p-1 -ml-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={ariaLabel}
            title={mounted ? (tooltipText || resolvedHeaderText) : "India"}
        >
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="min-w-0 flex-1 font-medium text-left leading-tight text-foreground/90">
                <span className={`block truncate transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    {resolvedHeaderText}
                </span>
            </span>
        </button>
    );
}
