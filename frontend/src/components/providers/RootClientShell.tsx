"use client";

import type { ReactNode } from "react";

import { ErrorBoundary } from "@/errors";
import { PopupProvider } from "@/context/PopupProvider";
import { LocationProvider } from "@/context/LocationContext";

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
                </LocationProvider>
            </PopupProvider>
        </ErrorBoundary>
    );
}
