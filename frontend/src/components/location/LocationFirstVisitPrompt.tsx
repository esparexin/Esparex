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
        <div className={cn("relative rounded-3xl border bg-background/95 p-4 shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-3 duration-200 sm:rounded-2xl sm:slide-in-from-top-2", className)}>
            <button
                type="button"
                onClick={onDismiss}
                className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss location prompt"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="pr-10">
                <p className="text-base font-semibold leading-7 text-foreground sm:text-sm sm:leading-6">
                    Use your current location to see nearby listings.
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground sm:text-xs sm:leading-5">
                    Or choose a state, district, city, area, or village manually.
                </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button type="button" className="h-11 w-full gap-2 rounded-2xl text-base font-semibold sm:w-auto sm:text-sm" onClick={onUseCurrentLocation}>
                    <Crosshair className="h-4 w-4" />
                    Use Current Location
                </Button>
                <Button type="button" variant="outline" className="h-11 w-full gap-2 rounded-2xl text-base font-semibold sm:w-auto sm:text-sm" onClick={onChooseManually}>
                    <MapPin className="h-4 w-4" />
                    Choose Manually
                </Button>
            </div>
        </div>
    );
}
