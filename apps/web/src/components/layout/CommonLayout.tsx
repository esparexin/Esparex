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


import { PageLayout } from '@esparex/ui';

interface CommonLayoutProps {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
    suspenseHeader?: boolean;
    currentYear?: number;
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
    const activeYear = currentYear ?? new Date().getUTCFullYear();
    const pathname = usePathname();
    const chatRoute = isChatRoute(pathname);
    const segments = pathname?.split("/").filter(Boolean) ?? [];
    const isWizardRoute =
        segments[0] === "edit-ad" ||
        segments[0] === "post-service";

    // Chat routes: keep the existing default layout & site header intact.
    // Only suppress the footer and FAB — the account dimensions don't change.
    // Wizard routes: retain existing fullscreen + no-header immersive behavior.
    const hideHeader = isWizardRoute;
    const hideFooter = chatRoute || isWizardRoute;
    const useFullscreen = isWizardRoute; // Chat does NOT use fullscreen

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
                <PageLayout
                    variant={useFullscreen ? "fullscreen" : "default"}
                    header={!hideHeader ? header : undefined}
                >
                    <ScrollSentinel />
                    <ClientChromeLoader apiUnavailable={false} />
                    <RouteScrollReset />

                    {children}

                    {!hideFooter && <BusinessPostFAB />}
                    {!hideFooter && <Footer currentYear={activeYear} />}
                </PageLayout>
            </BottomBarProvider>
        </UserAppProviders>
    );
}
