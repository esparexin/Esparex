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
        <div className={cn("relative rounded-3xl border bg-white/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 sm:rounded-2xl sm:slide-in-from-top-2 glass", className)}>
            {/* Mobile Grab Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
            
            <button
                type="button"
                onClick={onDismiss}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-slate-100 hover:text-foreground active:scale-90"
                aria-label="Dismiss location prompt"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="pr-10">
                <p className="text-base font-semibold leading-7 text-foreground sm:text-sm sm:leading-6">
                    Use your current location to see nearby listings.
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground sm:text-xs sm:leading-5">
                    Or choose a state, district, city, area, or village manually.
                </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button type="button" className="h-12 w-full gap-2 rounded-2xl text-base font-bold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 sm:w-auto sm:text-sm" onClick={onUseCurrentLocation}>
                    <Crosshair className="h-4 w-4" />
                    Use Current Location
                </Button>
                <Button type="button" variant="outline" className="h-12 w-full gap-2 rounded-2xl text-base font-bold border-slate-200 bg-white/50 transition-all hover:bg-white hover:border-slate-300 active:scale-95 sm:w-auto sm:text-sm" onClick={onChooseManually}>
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Choose Manually
                </Button>
            </div>
        </div>
    );
}
