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

import { PageLayout } from '@esparex/ui';
import { isWizardPathname } from '@/lib/routeUtils';

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
    const isWizardRoute = isWizardPathname(pathname);

    // Chat & regular routes: keep the default layout & site header and footer intact.
    // Wizard routes: retain fullscreen + no-header immersive behavior.
    const hideHeader = isWizardRoute;
    const hideFooter = isWizardRoute;
    const useFullscreen = isWizardRoute;

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
