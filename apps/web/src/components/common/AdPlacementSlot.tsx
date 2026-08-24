"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { InContentPlacementId, AdCampaignItem } from "@esparex/contracts";
import { useAdPlacement } from "@/hooks/useAdPlacement";
import { SafeImage } from "@/components/ui/SafeImage";

interface AdPlacementSlotProps {
  placement: InContentPlacementId;
  category?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

function GoogleAdSenseSlot({
  ad,
  className,
  onImpression,
}: {
  ad: AdCampaignItem;
  className?: string;
  onImpression: (id: string) => void;
}) {
  const [adStatus, setAdStatus] = useState<"loading" | "filled" | "unfilled">("loading");
  const insRef = useRef<HTMLModElement>(null);
  const publisherId =
    ad.providerConfig?.googlePublisherId ||
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ||
    "ca-pub-esparex-official-master";
  const slotId = ad.providerConfig?.googleSlotId;

  const handleStatusCheck = useCallback(() => {
    if (!insRef.current) return;
    const statusAttr = insRef.current.getAttribute("data-ad-status");
    if (statusAttr === "filled") {
      setAdStatus("filled");
      onImpression(ad.id);
    } else if (statusAttr === "unfilled") {
      setAdStatus("unfilled");
    } else if (insRef.current.clientHeight > 0 || insRef.current.querySelector("iframe")) {
      setAdStatus("filled");
      onImpression(ad.id);
    }
  }, [ad.id, onImpression]);

  useEffect(() => {
    if (!slotId) {
      setAdStatus("unfilled");
      return;
    }

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      setAdStatus("unfilled");
      return;
    }

    const ins = insRef.current;
    if (!ins) return;

    const observer = new MutationObserver(() => {
      handleStatusCheck();
    });

    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
      childList: true,
      subtree: true,
    });

    const timer = setTimeout(() => {
      handleStatusCheck();
      setAdStatus((prev) => (prev === "loading" ? "unfilled" : prev));
    }, 2500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [slotId, handleStatusCheck]);

  if (adStatus === "unfilled") {
    if (ad.fallbackStrategy === "house_ad" || ad.fallbackStrategy === "internal_promo") {
      return (
        <aside
          role="region"
          aria-label="Esparex Announcement"
          className={`w-full rounded-2xl p-4 bg-primary/5 border border-primary/20 text-foreground flex flex-col gap-1.5 ${className || ""}`}
        >
          <span className="text-tiny font-bold uppercase tracking-wider text-primary block">
            Esparex Notice
          </span>
          <h4 className="text-caption font-bold text-foreground">Promote Your Business on Esparex</h4>
          <p className="text-tiny text-foreground-subtle">Reach thousands of active buyers and sellers daily.</p>
        </aside>
      );
    }
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Google Advertisement"
      className={`w-full rounded-2xl overflow-hidden border border-border bg-muted/30 p-2 text-center my-3 transition-opacity duration-300 ${
        adStatus === "filled" ? "opacity-100 block" : "opacity-0 h-0 p-0 m-0 border-0 overflow-hidden"
      } ${className || ""}`}
    >
      <span className="block text-tiny font-bold uppercase tracking-wider text-foreground-subtle mb-1">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={ad.providerConfig?.googleFormat || "auto"}
        data-full-width-responsive="true"
      />
    </aside>
  );
}

export function AdPlacementSlot({
  placement,
  category,
  className = "",
}: AdPlacementSlotProps) {
  const { ad, fallbackAd, isLoading, recordImpression, recordClick } = useAdPlacement(placement, category);
  const impressionRecorded = useRef<string | null>(null);

  const activeAd = ad || fallbackAd;

  const handleImpression = useCallback(
    (id: string) => {
      if (impressionRecorded.current !== id) {
        impressionRecorded.current = id;
        recordImpression(id);
      }
    },
    [recordImpression]
  );

  useEffect(() => {
    if (activeAd && activeAd.providerType !== "google_adsense") {
      handleImpression(activeAd.id);
    }
  }, [activeAd, handleImpression]);

  // Clean Zero-Whitespace Rule: If no active ad, render NOTHING
  if (isLoading || !activeAd) {
    return null;
  }

  // 1. Custom Sponsor Banner
  if (activeAd.providerType === "custom_banner" && activeAd.providerConfig?.bannerImageUrl) {
    return (
      <aside
        role="region"
        aria-label="Sponsored Advertisement"
        className={`w-full rounded-2xl overflow-hidden border border-border bg-card shadow-2xs group transition-all my-3 ${className}`}
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border">
          <span className="text-tiny font-bold uppercase tracking-wider text-foreground-subtle">
            Sponsored
          </span>
        </div>
        <a
          href={activeAd.providerConfig.bannerTargetUrl || "#"}
          target={activeAd.providerConfig.openInNewTab ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={() => recordClick(activeAd.id)}
          className="block relative w-full aspect-[16/9] sm:aspect-[4/1] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

  // 2. Google AdSense / Ad Manager
  if (
    (activeAd.providerType === "google_adsense" || activeAd.providerType === "google_ad_manager") &&
    activeAd.providerConfig?.googleSlotId
  ) {
    return <GoogleAdSenseSlot ad={activeAd} className={className} onImpression={handleImpression} />;
  }

  // 3. Internal House Ad
  if (activeAd.providerType === "house_ad") {
    return (
      <aside
        role="region"
        aria-label="Esparex Announcement"
        className={`w-full rounded-2xl p-4 bg-primary/5 border border-primary/20 text-foreground flex flex-col gap-1.5 my-3 ${className}`}
      >
        <span className="text-tiny font-bold uppercase tracking-wider text-primary block">
          Esparex Notice
        </span>
        <h4 className="text-caption font-bold text-foreground">{activeAd.name}</h4>
        {activeAd.providerConfig?.bannerTargetUrl && (
          <a
            href={activeAd.providerConfig.bannerTargetUrl}
            onClick={() => recordClick(activeAd.id)}
            className="text-caption font-bold text-primary hover:underline block pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Learn more →
          </a>
        )}
      </aside>
    );
  }

  return null;
}
