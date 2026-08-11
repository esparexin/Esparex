"use client";

import { useEffect, useRef } from "react";

interface AdPlacementSlotProps {
    /** AdSense slot ID or custom placement identifier */
    slotId?: string;
    /** Format variant: "banner" (728x90 / responsive horizontal) or "rectangle" (300x250 medium rectangle) */
    variant?: "banner" | "rectangle";
    className?: string;
}

export function AdPlacementSlot({
    slotId = "default-listing-ad",
    variant = "banner",
    className = "",
}: AdPlacementSlotProps) {
    const adRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Attempt to push AdSense ad if window.adsbygoogle is available
        try {
            if (typeof window !== "undefined" && (window as any).adsbygoogle) {
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            }
        } catch {
            // Safe fallback if AdSense script is blocked or missing
        }
    }, []);

    const isBanner = variant === "banner";

    return (
        <div
            ref={adRef}
            className={`w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-center ${className}`}
            role="region"
            aria-label="Advertisement"
        >
            <div className="mb-2 flex items-center justify-between text-tiny font-bold uppercase tracking-wider text-slate-400">
                <span>Advertisement</span>
                <span className="text-2xs text-slate-300">Sponsored</span>
            </div>

            {/* Google AdSense container / Sponsored Banner Fallback */}
            <div
                className={`mx-auto flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/80 transition-colors ${
                    isBanner ? "min-h-[90px] py-4 px-6" : "min-h-[250px] p-6"
                }`}
            >
                {/* Fallback Display Banner (Replaced automatically when AdSense script runs) */}
                <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                    <p className="text-xs font-semibold text-slate-600">
                        Promote your products or services here
                    </p>
                    <p className="text-2xs text-slate-400">
                        Targeted reach across local device buyers and repair professionals
                    </p>
                </div>

                <ins
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client="ca-pub-esparex"
                    data-ad-slot={slotId}
                    data-ad-format={isBanner ? "horizontal" : "auto"}
                    data-full-width-responsive="true"
                />
            </div>
        </div>
    );
}
