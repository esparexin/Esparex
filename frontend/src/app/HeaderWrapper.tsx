"use client";


import { UserHeader } from '@/components/user/UserHeader';
import { useRouter, useSearchParams, useSelectedLayoutSegments, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from '@/context/NavigationContext';

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
        const basePath = pathname || "/";
        const params = new URLSearchParams(searchParams.toString());
        params.delete("callbackUrl");
        const query = params.toString();
        return query ? `${basePath}?${query}` : basePath;
    }, [pathname, searchParams]);

    const handleShowLogin = () => {
        void router.push(`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`);
    };

    const handleLogout = () => {
        confirmNavigation(async () => {
            try {
                await logout();
            } catch (e) {
                logger.error("Logout failed", e);
            } finally {
                void router.replace('/');
            }
        });
    };

    // Navigation must be side-effect free. Auth handled by guards only.
    const { navigateTo } = useAppNavigation();

    const handleSearch = (query: string) => {
        if (!query.trim()) return;
        const encodedQuery = encodeURIComponent(query.trim());
        void router.push(`/search?q=${encodedQuery}`);
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
