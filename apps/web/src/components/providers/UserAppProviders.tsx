"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { BackendStatusProvider } from "@/context/BackendStatusContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { AppBootstrapProvider } from "@/components/providers/AppBootstrapProvider";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { PostAdModalProvider } from "@/context/PostAdModalContext";

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
                <AppBootstrapProvider initialHasAuthCookie={initialHasAuthCookie}>
                    <BackendStatusProvider>
                        <NavigationProvider>
                            <AuthModalProvider>
                                <PostAdModalProvider>
                                    <PwaRegister />
                                    {children}
                                </PostAdModalProvider>
                            </AuthModalProvider>
                        </NavigationProvider>
                    </BackendStatusProvider>
                </AppBootstrapProvider>
            </AuthProvider>
        </ReactQueryProvider>
    );
}
