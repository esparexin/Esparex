"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@esparex/ui";
import { ShieldCheck, X } from "@/icons/IconRegistry";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "esparex_cookie_consent";

export function CookieConsentBanner() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const hasMobileBottomNav = getMobileChromePolicy(pathname).showMobileBottomNav;

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) {
            setVisible(true);
        }
    }, []);

    const handleAccept = useCallback(() => {
        localStorage.setItem(CONSENT_KEY, "accepted");
        setVisible(false);
    }, []);

    const handleDecline = useCallback(() => {
        localStorage.setItem(CONSENT_KEY, "declined");
        setVisible(false);
    }, []);

    const handleDismiss = useCallback(() => {
        localStorage.setItem(CONSENT_KEY, "dismissed");
        setVisible(false);
    }, []);

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
                "pointer-events-none fixed left-0 right-0 z-40 px-3 sm:px-4 md:left-6 md:right-auto md:max-w-md",
                hasMobileBottomNav
                    ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] pb-1"
                    : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
            )}
        >
            <div className="pointer-events-auto bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl shadow-black/10 p-4 sm:p-4.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                        </div>
                        <span className="text-small font-semibold text-foreground tracking-tight">
                            Cookie Preferences
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="text-foreground-tertiary hover:text-foreground rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Dismiss cookie banner"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <p className="text-caption text-foreground-secondary leading-relaxed mb-3.5">
                    We use essential cookies to keep your account secure and remember your preferences. Optional cookies help track ad view counts.{" "}
                    <Link
                        href="/privacy"
                        prefetch={false}
                        className="text-link hover:underline font-medium inline-block whitespace-nowrap"
                    >
                        Privacy Policy
                    </Link>
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDecline}
                        className="flex-1 h-9 text-caption text-foreground-secondary border-border hover:bg-muted"
                    >
                        Essential Only
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAccept}
                        className="flex-1 h-9 text-caption font-semibold"
                    >
                        Accept All
                    </Button>
                </div>
            </div>
        </aside>
    );
}
