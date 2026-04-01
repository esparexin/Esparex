"use client";


import { UserHeader } from '@/components/user/UserHeader';
import { useRouter, useSearchParams, useSelectedLayoutSegments, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from '@/context/NavigationContext';
import { buildAuthCallbackUrl, buildLoginUrl, markLogoutRedirectBypass } from "@/lib/authHelpers";
import { buildPublicBrowseRouteFromPathname } from "@/lib/publicBrowseRoutes";

import MobileHeader from "@/components/mobile/MobileHeader";
import { MobileNavDrawerProvider } from "@/components/mobile/MobileNavDrawerProvider";
import { MobileNavDrawer } from "@/components/mobile/MobileNavDrawer";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import logger from "@/lib/logger";

export function HeaderWrapper() {
    const router = useRouter();
    const segments = useSelectedLayoutSegments();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, status, logout } = useAuth();
    const { confirmNavigation } = useNavigation();

    // Derived state
    const isLoggedIn = status === "authenticated";
    const isAuthLoading = status === "loading";
    const isAdminRoute = segments[0] === 'admin';
    const isWizardRoute =
        segments[0] === "post-ad" ||
        segments[0] === "edit-ad" ||
        segments[0] === "post-service" ||
        (segments[0] === "account" && segments[1] === "business" && segments[2] === "apply");

    const loginCallbackUrl = useMemo(() => {
        return buildAuthCallbackUrl(pathname || "/", searchParams);
    }, [pathname, searchParams]);

    const handleShowLogin = () => {
        void router.push(buildLoginUrl(loginCallbackUrl));
    };

    const handleLogout = () => {
        confirmNavigation(async () => {
            try {
                markLogoutRedirectBypass();
                void router.replace('/');
                await logout();
            } catch (e) {
                logger.error("Logout failed", e);
            }
        });
    };

    // Navigation must be side-effect free. Auth handled by guards only.
    const { navigateTo } = useAppNavigation();

    const handleSearch = (query: string) => {
        if (!query.trim()) return;
        void router.push(buildPublicBrowseRouteFromPathname(pathname || "/", { q: query.trim() }));
    };

    if (isAdminRoute || isWizardRoute) return null;

    return (
        <MobileNavDrawerProvider>
            <UserHeader
                currentPage={pathname}
                navigateTo={navigateTo}
                isLoggedIn={isLoggedIn}
                isAuthLoading={isAuthLoading}
                onLogout={handleLogout}
                user={user}
                onShowLogin={handleShowLogin}
                onSearch={handleSearch}
            />

            <MobileHeader
                navigateTo={navigateTo}
                isLoggedIn={isLoggedIn}
                isAuthLoading={isAuthLoading}
                onShowLogin={handleShowLogin}
                onSearch={handleSearch}
            />

            <MobileNavDrawer
                isLoggedIn={isLoggedIn}
                isAuthLoading={isAuthLoading}
                user={user}
                onShowLogin={handleShowLogin}
                onLogout={handleLogout}
                navigateTo={navigateTo}
            />
        </MobileNavDrawerProvider>
    );
}
