import * as React from "react";
import { cn } from "../utils";

export interface GoogleAdUnitProps {
  slot: string;
  client?: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  ariaLabel?: string;
  fallbackStrategy?: "collapse" | "internal_promo";
  fallbackContent?: React.ReactNode;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
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
    } catch (err) {
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
          "flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500",
          className
        )}
      >
        {fallbackContent || (
          <div>
            <p className="font-bold text-slate-700">Promote Your Business on Esparex</p>
            <p className="text-tiny text-slate-500 mt-0.5">Reach thousands of buyers & sellers daily</p>
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
