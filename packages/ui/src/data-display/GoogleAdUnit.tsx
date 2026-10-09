import * as React from "react";
import { cn } from "../utils";
import type { AdProviderConfig } from "@esparex/contracts";
import { AD_FALLBACK_STRATEGY } from "@esparex/contracts";

export type GoogleAdFormat = NonNullable<AdProviderConfig["googleFormat"]>;
export type GoogleAdFallbackStrategy = (typeof AD_FALLBACK_STRATEGY)[keyof typeof AD_FALLBACK_STRATEGY];

export interface GoogleAdUnitProps {
  slot: string;
  client?: string;
  format?: GoogleAdFormat;
  responsive?: boolean;
  className?: string;
  ariaLabel?: string;
  fallbackStrategy?: GoogleAdFallbackStrategy;
  fallbackContent?: React.ReactNode;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function GoogleAdUnit({
  slot,
  client = "ca-pub-esparex-official-master",
  format = "auto",
  responsive = true,
  className,
  ariaLabel = "Advertisement",
  fallbackStrategy = "collapse",
  fallbackContent,
}: GoogleAdUnitProps) {
  const [adFailed, setAdFailed] = React.useState(false);
  const adRef = React.useRef<HTMLModElement>(null);

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      setAdFailed(true);
    }
  }, [slot]);

  if (adFailed) {
    if (fallbackStrategy === "collapse") {
      return null;
    }
    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted p-4 text-center text-caption text-muted-foreground",
          className
        )}
      >
        {fallbackContent || (
          <div>
            <p className="font-bold text-foreground">Promote Your Business on Esparex</p>
            <p className="text-tiny text-muted-foreground mt-0.5">Reach thousands of buyers & sellers daily</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn("overflow-hidden max-w-full flex justify-center items-center my-2", className)}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
