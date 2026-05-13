"use client";

import type { ReactNode } from "react";

import { ErrorBoundary } from "@/errors";
import { PopupProvider } from "@/context/PopupProvider";
import { LocationProvider } from "@/context/LocationContext";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import { AppFeedbackProvider } from "@/context/FeedbackSystemContext";
import { SuccessFeedbackBanner, ErrorFeedbackBanners } from "@/components/feedback/SystemFeedbackBanners";

export function RootClientShell({
    children,
    initialHasAuthCookie = false,
}: {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
}) {
    return (
        <ErrorBoundary>
            <AppFeedbackProvider>
                <PopupProvider>
                    <LocationProvider initialHasAuthCookie={initialHasAuthCookie}>
                        <SuccessFeedbackBanner />
                        <ErrorFeedbackBanners />
                        {children}
                        <CookieConsentBanner />
                    </LocationProvider>
                </PopupProvider>
            </AppFeedbackProvider>
        </ErrorBoundary>
    );
}
