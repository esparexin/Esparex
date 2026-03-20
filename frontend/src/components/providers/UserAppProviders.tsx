"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { BackendStatusProvider } from "@/context/BackendStatusContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { AppErrorBanner } from "@/components/common/AppErrorBanner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { AppBootstrapProvider } from "@/components/providers/AppBootstrapProvider";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export function UserAppProviders({
    children,
    initialHasAuthCookie = false,
}: {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
}) {
    return (
        <ReactQueryProvider>
            <AuthProvider initialHasAuthCookie={initialHasAuthCookie}>
                <AppBootstrapProvider>
                    <BackendStatusProvider>
                        <NavigationProvider>
                            <PwaRegister />
                            <AppErrorBanner />
                            {children}
                        </NavigationProvider>
                    </BackendStatusProvider>
                </AppBootstrapProvider>
            </AuthProvider>
        </ReactQueryProvider>
    );
}
