"use client";

import { AlertTriangle, WifiOff, Z_INDEX } from "@esparex/ui";
import { useBackendStatus } from "@/context/BackendStatusContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface StatusBannerHostProps {
    apiUnavailable?: boolean;
}

/**
 * Single priority status banner host — sole owner of the sticky status strip.
 *
 * Replaces the former BackendStatusBanner + ConnectivityBanner pair, whose two
 * independent `sticky top-0` strips stacked on top of each other and painted
 * above dialog/sheet backdrops (zIndex 9999/10000).
 *
 * Invariants (enforced by guard-ui-architecture `sticky-z-host`):
 * - Exactly one strip renders, resolved by priority:
 *   offline (device) > service degraded (backend down / apiUnavailable).
 * - Stacking: Z_INDEX.statusBanner (999) — visible over page chrome via DOM
 *   order, always covered by dialog/sheet systems (>= 1000).
 */
export function StatusBannerHost({ apiUnavailable = false }: StatusBannerHostProps) {
    const isOnline = useOnlineStatus();
    const { isBackendUp, checked, apiBaseUrl } = useBackendStatus();

    const isOffline = !isOnline;
    const isServiceDegraded = apiUnavailable || (checked && !isBackendUp);

    if (isOffline) {
        return (
            <div
                role="status"
                aria-live="polite"
                style={{ zIndex: Z_INDEX.statusBanner }} /* design-token-ignore: canonical Z_INDEX.statusBanner inline z-index */
                className="w-full py-2 px-4 flex items-center justify-center gap-2 transition-all duration-300 sticky top-0 shadow-md bg-destructive text-destructive-foreground"
            >
                <WifiOff size={18} aria-hidden="true" />
                <span className="text-body font-medium">
                    You&rsquo;re offline. Check your internet connection.
                </span>
            </div>
        );
    }

    if (isServiceDegraded) {
        return (
            <div
                role="status"
                aria-live="polite"
                style={{ zIndex: Z_INDEX.statusBanner }} /* design-token-ignore: canonical Z_INDEX.statusBanner inline z-index */
                className="w-full py-2 px-4 flex items-center justify-center gap-2 transition-all duration-300 sticky top-0 shadow-md border-b border-border bg-warning-subtle text-warning-dark"
            >
                <AlertTriangle size={18} aria-hidden="true" />
                <span className="text-body font-medium">
                    Some services are temporarily unavailable. You can still browse, but login
                    and transactions may be limited.
                    {apiBaseUrl ? ` API health check: ${apiBaseUrl}` : ""}
                </span>
            </div>
        );
    }

    return null;
}
