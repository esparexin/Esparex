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
import { getMobileChromePolicy, isChatRoute } from '@/lib/mobile/chromePolicy';

interface CommonLayoutProps {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
    suspenseHeader?: boolean;
    currentYear: number;
}

/**
 * CommonLayout unified structure for both public and private pages.
 * Handles providers, header/footer, and basic page shell.
 */
export function CommonLayout({
    children,
    initialHasAuthCookie = false,
    suspenseHeader = false,
    currentYear,
}: CommonLayoutProps) {
    const pathname = usePathname();
    const chatRoute = isChatRoute(pathname);
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const isWizardRoute =
        segments[0] === "post-ad" ||
        segments[0] === "edit-ad" ||
        segments[0] === "post-service" ||
        (segments[0] === "account" && segments[1] === "business" && segments[2] === "apply");
    const hideShellExtras = chatRoute || isWizardRoute;
    const hasMobileBottomNav = !hideShellExtras && getMobileChromePolicy(pathname).showMobileBottomNav;
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
                <div className={hideShellExtras ? "flex h-dvh flex-col overflow-hidden overflow-x-clip" : "flex min-h-screen flex-col overflow-x-clip"}>
                    <ScrollSentinel />
                    {!hideShellExtras && header}
                    <ClientChromeLoader apiUnavailable={false} />
                    <RouteScrollReset />
                    <main className={hideShellExtras ? "flex-1 min-h-0" : hasMobileBottomNav ? "flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0" : "flex-1"}>
                        {children}
                    </main>
                    {!hideShellExtras && <BusinessPostFAB />}
                    {!hideShellExtras && <Footer currentYear={currentYear} />}
                </div>
            </BottomBarProvider>
        </UserAppProviders>
    );
}
