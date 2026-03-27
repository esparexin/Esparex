"use client";

/**
 * Shared shell for all /account/* pages.
 * Each sub-route passes the correct `tab` value; this component
 * handles auth loading, refreshUser wiring, and renders ProfileSettingsSidebar.
 */

import { useRouter } from "next/navigation";
import { ProfileSettingsSidebar } from "@/components/user/ProfileSettingsSidebar";
import { UserPage, getPageRoute } from "@/lib/routeUtils";
import { useUser } from "@/hooks/useUser";
import { LoadingSpinner } from "@/components/ui/LoadingAnimation";

interface AccountPageShellProps {
    tab: string;
}

export function AccountPageShell({ tab }: AccountPageShellProps) {
    const router = useRouter();
    const { user, loading, refreshUser, logout } = useUser();

    const navigateTo = (
        page: UserPage,
        adId?: string | number,
        category?: string,
        businessId?: string | number,
        serviceId?: string | number
    ) => {
        void router.push(getPageRoute(page, { adId, category, businessId, serviceId }));
    };

    if (loading) return <LoadingSpinner />;

    return (
        <ProfileSettingsSidebar
            navigateTo={navigateTo}
            user={user}
            onUpdateUser={() => { void refreshUser(); }}
            onLogout={async () => {
                await logout();
                void router.push("/");
            }}
            initialTab={tab}
        />
    );
}
