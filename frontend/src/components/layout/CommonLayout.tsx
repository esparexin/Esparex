"use client";

import { ReactNode, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { BottomBarProvider } from '@/context/BottomBarContext';
import { RouteScrollReset } from '@/components/common/RouteScrollReset';
import { Footer } from '@/components/common/Footer';
import { BusinessPostFAB } from '@/components/layout/BusinessPostFAB';
import { UserAppProviders } from '@/components/providers/UserAppProviders';
import { HeaderWrapper } from '@/app/HeaderWrapper';
import { ClientChromeLoader } from '@/components/layout/ClientChromeLoader';
import { ScrollSentinel } from '@/components/common/ScrollSentinel';
import { isChatRoute } from '@/lib/mobile/chromePolicy';

interface CommonLayoutProps {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
    suspenseHeader?: boolean;
}

/**
 * CommonLayout unified structure for both public and private pages.
 * Handles providers, header/footer, and basic page shell.
 */
export function CommonLayout({
    children,
    initialHasAuthCookie = false,
    suspenseHeader = false,
}: CommonLayoutProps) {
    const pathname = usePathname();
    const chatRoute = isChatRoute(pathname);
    const header = suspenseHeader ? (
        <Suspense fallback={null}>
            <HeaderWrapper />
        </Suspense>
    ) : (
        <HeaderWrapper />
    );

    return (
        <UserAppProviders initialHasAuthCookie={initialHasAuthCookie}>
            <BottomBarProvider>
                <div className={chatRoute ? "flex h-dvh flex-col overflow-hidden overflow-x-clip" : "flex min-h-screen flex-col overflow-x-clip"}>
                    <ScrollSentinel />
                    {!chatRoute && header}
                    <ClientChromeLoader apiUnavailable={false} />
                    <RouteScrollReset />
                    <main className={chatRoute ? "flex-1 min-h-0" : "flex-1 pb-20 md:pb-0"}>
                        {children}
                    </main>
                    {!chatRoute && <BusinessPostFAB />}
                    {!chatRoute && <Footer />}
                </div>
            </BottomBarProvider>
        </UserAppProviders>
    );
}
