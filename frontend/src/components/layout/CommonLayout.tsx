"use client";

import { ReactNode, Suspense } from 'react';
import { BottomBarProvider } from '@/context/BottomBarContext';
import { RouteScrollReset } from '@/components/common/RouteScrollReset';
import { Footer } from '@/components/common/Footer';
import { BusinessPostFAB } from '@/components/layout/BusinessPostFAB';
import { UserAppProviders } from '@/components/providers/UserAppProviders';
import { HeaderWrapper } from '@/app/HeaderWrapper';
import { ClientChromeLoader } from '@/components/layout/ClientChromeLoader';
import { ScrollSentinel } from '@/components/common/ScrollSentinel';

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
                <div className="flex min-h-screen flex-col overflow-x-clip">
                    <ScrollSentinel />
                    {header}
                    <ClientChromeLoader apiUnavailable={false} />
                    <RouteScrollReset />
                    <main className="flex-1 pb-20 md:pb-0">
                        {children}
                    </main>
                    <BusinessPostFAB />
                    <Footer />
                </div>
            </BottomBarProvider>
        </UserAppProviders>
    );
}
