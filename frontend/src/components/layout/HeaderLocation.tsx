"use client";


import { MapPin } from "lucide-react";
import { useLocationState } from "@/context/LocationContext";
import { getHeaderLocationText } from "@/lib/location/locationService";
import { useMounted } from "@/hooks/useMounted";

export function HeaderLocation({ onClick }: { onClick?: () => void }) {
    const { location } = useLocationState();
    const mounted = useMounted();
    const { headerText } = getHeaderLocationText(location);
    // Only use the real location text after mount — pre-mount renders the static
    // placeholder so SSR HTML and the initial client render are identical, avoiding
    // a hydration mismatch when location is loaded from localStorage on the client.
    const resolvedHeaderText = mounted ? (headerText || "India") : "India";

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -ml-1 cursor-pointer"
            aria-label="Current location"
        >
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-left leading-tight text-foreground/90 max-w-[180px] truncate block">
                <span className={`block transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`}>
                    {resolvedHeaderText}
                </span>
            </span>
        </button>
    );
}
