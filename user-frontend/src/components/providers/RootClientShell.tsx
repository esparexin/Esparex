"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { ErrorBoundary } from "@/errors";
import { PopupProvider } from "@/context/PopupProvider";
import { LocationProvider } from "@/context/LocationContext";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { useEffect } from "react";

export function RootClientShell({
    children,
    initialHasAuthCookie = false,
}: {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
}) {
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_APP_VERSION) {
            console.log(`🚀 Esparex App Loaded - v${process.env.NEXT_PUBLIC_APP_VERSION}`);
        }
    }, []);

    return (
        <ErrorBoundary>
            <PopupProvider>
                <LocationProvider initialHasAuthCookie={initialHasAuthCookie}>
                    {children}
                    <CookieConsentBanner />
                </LocationProvider>
            </PopupProvider>
            <Toaster
                position="bottom-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{ style: { fontFamily: 'var(--font-inter)' } }}
            />
        </ErrorBoundary>
    );
}
