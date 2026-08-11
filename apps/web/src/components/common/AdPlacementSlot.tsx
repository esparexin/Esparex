"use client";

import { useEffect, useRef } from "react";
import type { InContentPlacementId } from "@esparex/contracts";
import { useAdPlacement } from "@/hooks/useAdPlacement";
import { SafeImage } from "@/components/ui/SafeImage";

interface AdPlacementSlotProps {
  placement: InContentPlacementId;
  category?: string;
  className?: string;
}

export function AdPlacementSlot({
  placement,
  category,
  className = "",
}: AdPlacementSlotProps) {
  const { ad, fallbackAd, isLoading, recordImpression, recordClick } = useAdPlacement(placement, category);
  const impressionRecorded = useRef<string | null>(null);

  const activeAd = ad || fallbackAd;

  useEffect(() => {
    if (activeAd && impressionRecorded.current !== activeAd.id) {
      impressionRecorded.current = activeAd.id;
      recordImpression(activeAd.id);
    }
  }, [activeAd, recordImpression]);

  // Clean Zero-Whitespace Rule: If no active ad, render NOTHING
  if (isLoading || !activeAd) {
    return null;
  }

  // 1. Custom Sponsor Banner
  if (activeAd.providerType === "custom_banner" && activeAd.providerConfig?.bannerImageUrl) {
    return (
      <aside
        aria-label="Sponsored Advertisement"
        className={`w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-2xs group transition-all ${className}`}
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/80 border-b border-slate-100">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Sponsored
          </span>
        </div>
        <a
          href={activeAd.providerConfig.bannerTargetUrl || "#"}
          target={activeAd.providerConfig.openInNewTab ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={() => recordClick(activeAd.id)}
          className="block relative w-full aspect-[16/9] sm:aspect-[4/1] overflow-hidden"
        >
          <SafeImage
            src={activeAd.providerConfig.bannerImageUrl}
            alt={activeAd.providerConfig.bannerAltText || activeAd.name}
            fill
            className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
          />
        </a>
      </aside>
    );
  }

  // 2. Google AdSense
  if (activeAd.providerType === "google_adsense" && activeAd.providerConfig?.googleSlotId) {
    return (
      <aside
        aria-label="Google Advertisement"
        className={`w-full rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-50/50 p-2 text-center my-3 ${className}`}
      >
        <span className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Advertisement
        </span>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={activeAd.providerConfig.googlePublisherId || ""}
          data-ad-slot={activeAd.providerConfig.googleSlotId}
          data-ad-format={activeAd.providerConfig.googleFormat || "auto"}
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  // 3. Internal House Ad
  if (activeAd.providerType === "house_ad") {
    return (
      <aside
        aria-label="Esparex Announcement"
        className={`w-full rounded-2xl p-4 bg-blue-50/60 border border-blue-100 text-slate-800 flex flex-col gap-1.5 ${className}`}
      >
        <span className="text-2xs font-bold uppercase tracking-wider text-blue-600 block">
          Esparex Notice
        </span>
        <h4 className="text-xs font-bold text-slate-800">{activeAd.name}</h4>
        {activeAd.providerConfig?.bannerTargetUrl && (
          <a
            href={activeAd.providerConfig.bannerTargetUrl}
            onClick={() => recordClick(activeAd.id)}
            className="text-xs font-bold text-blue-600 hover:underline block pt-1"
          >
            Learn more →
          </a>
        )}
      </aside>
    );
  }

  return null;
}
