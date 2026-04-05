"use client";

import type { ReactNode } from "react";

import { ErrorBoundary } from "@/errors";
import { PopupProvider } from "@/context/PopupProvider";
import { LocationProvider } from "@/context/LocationContext";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";

export function RootClientShell({
    children,
    initialHasAuthCookie = false,
}: {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
}) {
    return (
        <ErrorBoundary>
            <PopupProvider>
                <LocationProvider initialHasAuthCookie={initialHasAuthCookie}>
                    {children}
                    <CookieConsentBanner />
                </LocationProvider>
            </PopupProvider>
        </ErrorBoundary>
    );
}
