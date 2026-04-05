"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "@/icons/IconRegistry";
import { useLocationState } from "@/context/LocationContext";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "esparex_cookie_consent";

export function CookieConsentBanner() {
    const pathname = usePathname();
    const { shouldShowFirstVisitPrompt } = useLocationState();
    const [visible, setVisible] = useState(false);
    const hasMobileBottomNav = getMobileChromePolicy(pathname).showMobileBottomNav;

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) setVisible(true);
    }, []);

    if (!visible || shouldShowFirstVisitPrompt) return null;

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, "accepted");
        setVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem(CONSENT_KEY, "declined");
        setVisible(false);
    };

    return (
        <div
            className={cn(
                "pointer-events-none fixed left-0 right-0 z-40 px-4 md:bottom-0 md:pb-6",
                hasMobileBottomNav
                    ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] pb-2"
                    : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            )}
        >
            <div className="max-w-3xl mx-auto pointer-events-auto">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 px-4 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon + Text */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            We use essential cookies to keep you logged in and secure your account. Optional cookies help track ad view counts.{" "}
                            <Link
                                href="/privacy"
                                prefetch={false}
                                className="text-green-600 underline underline-offset-2 hover:text-green-700 font-medium whitespace-nowrap"
                            >
                                Cookie Policy
                            </Link>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDecline}
                            className="flex-1 sm:flex-none h-11 text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                            Decline Optional
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            className="flex-1 sm:flex-none h-11 bg-green-600 hover:bg-green-700 text-white"
                        >
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
