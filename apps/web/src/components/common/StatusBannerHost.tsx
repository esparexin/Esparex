"use client";

import { AlertTriangle, WifiOff, Z_INDEX, cn } from "@esparex/ui";
import { useBackendStatus } from "@/context/BackendStatusContext";
import { useOnlineStatus } from "@esparex/shared";

interface StatusBannerHostProps {
    apiUnavailable?: boolean;
    hasCompactHeader?: boolean;
    hideHeader?: boolean;
}

/**
 * Single priority status banner host — sole owner of the sticky status strip.
 * Invariants (enforced by guard-ui-architecture `sticky-z-host`):
 * - Exactly one strip: offline > service degraded.
 * - Stacking: Z_INDEX.statusBanner (999) — visible over page chrome, covered by dialogs (>=1000).
 */
export function StatusBannerHost({
    apiUnavailable = false,
    hasCompactHeader = false,
    hideHeader = false,
}: StatusBannerHostProps) {
    const isOnline = useOnlineStatus();
    const { isBackendUp, checked, apiBaseUrl } = useBackendStatus();

    const isOffline = !isOnline;
    const isServiceDegraded = apiUnavailable || (checked && !isBackendUp);
    if (!isOffline && !isServiceDegraded) return null;

    const stickyTopClass = hideHeader
        ? "sticky top-0"
        : hasCompactHeader
          ? "sticky top-[calc(3rem+env(safe-area-inset-top,0px))] md:top-16"
          : "sticky top-[calc(6.5rem+env(safe-area-inset-top,0px))] md:top-16";

    if (isOffline) {
        return (
            <div
                role="status"
                aria-live="polite"
                style={{ zIndex: Z_INDEX.statusBanner }} /* design-token-ignore: canonical Z_INDEX.statusBanner inline z-index */
                className={cn("w-full py-2 px-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-md bg-destructive text-destructive-foreground", stickyTopClass)}
            >
                <WifiOff size={18} aria-hidden="true" />
                <span className="text-body font-medium">You&rsquo;re offline. Check your internet connection.</span>
            </div>
        );
    }

    return (
        <div
            role="status"
            aria-live="polite"
            style={{ zIndex: Z_INDEX.statusBanner }} /* design-token-ignore: canonical Z_INDEX.statusBanner inline z-index */
            className={cn("w-full py-2 px-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-md border-b border-border bg-warning-subtle text-warning-dark", stickyTopClass)}
        >
            <AlertTriangle size={18} aria-hidden="true" />
            <span className="text-body font-medium">
                Some services are temporarily unavailable. You can still browse, but login and transactions may be limited.{apiBaseUrl ? ` API health check: ${apiBaseUrl}` : ""}
            </span>
        </div>
    );
}
