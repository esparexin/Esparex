"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { MapPin } from "lucide-react";
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
    className,
}: LocationFirstVisitPromptProps) {
    return (
        <div 
            className={cn(
                "relative bg-white border border-slate-100 shadow-xl duration-300 animate-in fade-in slide-in-from-bottom-4",
                "rounded-2xl p-4 sm:p-5", // Elegant and compact padding
                "font-inter max-w-sm mx-auto w-full",
                className
            )}
        >
            {/* Top Row: Icon + Content aligned beside each other */}
            <div className="flex items-center gap-3">
                {/* Visual Anchor: Green location icon inside a light green container */}
                <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600">
                    <MapPin className="h-4 w-4" />
                </div>
                
                {/* Optimized Compact Typography - Exactly One Line */}
                <div className="flex-1 text-[13px] leading-tight text-slate-600">
                    We use location to show nearby listings.{" "}
                    <Link 
                        href="/privacy" 
                        className="text-emerald-600 font-semibold underline hover:text-emerald-700 transition-colors inline-block"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </div>

            {/* Bottom Row: Minimalist side-by-side actions */}
            <div className="mt-4.5 flex gap-2.5">
                <Button 
                    type="button" 
                    variant="outline"
                    className="h-10 flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors active:scale-[0.98]"
                    onClick={onChooseManually}
                >
                    Choose Manually
                </Button>
                
                <Button 
                    type="button" 
                    className="h-10 flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors active:scale-[0.98]"
                    onClick={onUseCurrentLocation}
                >
                    Use Location
                </Button>
            </div>
        </div>
    );
}
