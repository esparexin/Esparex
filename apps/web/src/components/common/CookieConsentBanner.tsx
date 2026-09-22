"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@esparex/ui";
import { X } from "@esparex/ui";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "esparex_cookie_consent";

const listeners = new Set<() => void>();

function emitConsentChange() {
    listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
    listeners.add(callback);
    window.addEventListener("storage", callback);
    return () => {
        listeners.delete(callback);
        window.removeEventListener("storage", callback);
    };
}

function getSnapshot(): string | null {
    try {
        return localStorage.getItem(CONSENT_KEY);
    } catch {
        return null;
    }
}

function getServerSnapshot(): string | null {
    return "server_hydrating";
}

export function CookieConsentBanner() {
    const pathname = usePathname();
    const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const hasAnyBottomNav = getMobileChromePolicy(pathname).hasAnyBottomNav;

    const visible = consent === null;

    const setConsent = useCallback((value: string) => {
        try {
            localStorage.setItem(CONSENT_KEY, value);
            emitConsentChange();
        } catch {
            // ignore localStorage quota errors
        }
    }, []);

    const handleAccept = useCallback(() => {
        setConsent("accepted");
    }, [setConsent]);

    const handleDecline = useCallback(() => {
        setConsent("declined");
    }, [setConsent]);

    const handleDismiss = useCallback(() => {
        setConsent("dismissed");
    }, [setConsent]);

    // Keyboard navigation: Escape key to dismiss
    useEffect(() => {
        if (!visible) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleDismiss();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [visible, handleDismiss]);

    if (!visible) return null;

    return (
        <aside
            role="region"
            aria-label="Cookie consent preferences"
            className={cn(
                "pointer-events-none fixed z-40 px-3 sm:px-4",
                "left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-4xl md:w-[calc(100%-3rem)]",
                hasAnyBottomNav
                    ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] pb-1"
                    : "bottom-0 md:bottom-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-0"
            )}
        >
            <div className="pointer-events-auto bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl shadow-xl shadow-black/8 p-3 md:py-2.5 md:px-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4">
                    {/* Content area: Cookie icon + Text + Learn more link */}
                    <div className="flex items-start md:items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-body-lg select-none shrink-0 mt-0.5 md:mt-0" role="img" aria-label="Cookie">
                            🍪
                        </span>
                        <p className="text-caption sm:text-small text-foreground/90 leading-snug md:leading-normal">
                            We use essential cookies to personalize your experience.{" "}
                            <Link
                                href="/privacy"
                                prefetch={false}
                                className="text-foreground hover:text-primary font-medium underline underline-offset-4 decoration-border hover:decoration-primary transition-colors inline-block whitespace-nowrap"
                            >
                                Learn more
                            </Link>
                        </p>
                        {/* Mobile-only dismiss button */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="md:hidden ml-auto text-foreground-tertiary hover:text-foreground rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 -mr-1 -mt-0.5"
                            aria-label="Dismiss cookie banner"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDecline}
                            className="flex-1 md:flex-none h-8.5 md:h-8 px-3 text-caption text-foreground-secondary hover:text-foreground hover:bg-muted/70 rounded-xl"
                        >
                            Essential
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            className="flex-1 md:flex-none h-8.5 md:h-8 px-3.5 text-caption font-semibold rounded-xl shadow-2xs"
                        >
                            Accept All
                        </Button>
                        {/* Desktop-only dismiss button */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="hidden md:inline-flex text-foreground-tertiary hover:text-foreground rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                            aria-label="Dismiss cookie banner"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
