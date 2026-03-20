"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { Crosshair, MapPin, X } from "lucide-react";

interface LocationFirstVisitPromptProps {
    onUseCurrentLocation: () => void;
    onChooseManually: () => void;
    onDismiss: () => void;
    className?: string;
}

export default function LocationFirstVisitPrompt({
    onUseCurrentLocation,
    onChooseManually,
    onDismiss,
    className,
}: LocationFirstVisitPromptProps) {
    return (
        <div className={cn("relative rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur", className)}>
            <button
                type="button"
                onClick={onDismiss}
                className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss location prompt"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="pr-8">
                <p className="text-sm font-semibold text-foreground">
                    Use your current location to see nearby listings.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Or choose a state, district, city, area, or village manually.
                </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" className="gap-2" onClick={onUseCurrentLocation}>
                    <Crosshair className="h-4 w-4" />
                    Use Current Location
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-2" onClick={onChooseManually}>
                    <MapPin className="h-4 w-4" />
                    Choose Manually
                </Button>
            </div>
        </div>
    );
}
