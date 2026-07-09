"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { MapPin, X } from "lucide-react";
import Link from "next/link";

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
        <div 
            className={cn(
                "relative bg-white border border-slate-100 shadow-xl duration-300 animate-in fade-in slide-in-from-bottom-4",
                "rounded-2xl p-4 sm:p-5", // Elegant and compact padding
                "font-inter max-w-sm mx-auto w-full",
                "mb-[env(safe-area-inset-bottom)]", // Respect safe area on mobile devices
                className
            )}
            role="dialog"
            aria-labelledby="location-prompt-title"
            aria-describedby="location-prompt-desc"
        >
            {/* Absolute close button for clear dismissal */}
            <button 
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close location prompt"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Top Row: Icon + Content aligned beside each other */}
            <div className="flex items-start sm:items-center gap-3 pr-6">
                {/* Visual Anchor: Green location icon inside a light green container */}
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 mt-1 sm:mt-0">
                    <MapPin className="h-5 w-5" />
                </div>
                
                {/* Optimized Compact Typography - Increased to text-sm for WCAG legibility */}
                <div className="flex-1 text-sm leading-snug text-slate-700">
                    <span id="location-prompt-title" className="font-semibold block mb-0.5 text-slate-900">Allow location access?</span>
                    <span id="location-prompt-desc">We use your location to show nearby listings.{" "}</span>
                    <Link 
                        href="/privacy" 
                        className="text-emerald-600 font-semibold underline hover:text-emerald-700 transition-colors inline-block"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </div>

            {/* Bottom Row: Minimalist side-by-side actions */}
            <div className="mt-5 flex gap-2.5">
                <Button 
                    type="button" 
                    variant="outline"
                    className="h-11 flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-[0.98]"
                    onClick={onChooseManually}
                >
                    Choose Manually
                </Button>
                
                <Button 
                    type="button" 
                    className="h-11 flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors active:scale-[0.98]"
                    onClick={onUseCurrentLocation}
                >
                    Allow Location
                </Button>
            </div>
            
            <div className="mt-3 text-center">
                <button 
                    onClick={onDismiss}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
                >
                    Not Now
                </button>
            </div>
        </div>
    );
}
