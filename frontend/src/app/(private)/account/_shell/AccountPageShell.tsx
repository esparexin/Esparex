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
import { markLogoutRedirectBypass } from "@/lib/authHelpers";
import type { ProfileTabValue } from "@/config/navigation";
import type { ConversationListView } from "@/lib/api/chatApi";
import type { IConversationDTO } from "@shared/contracts/chat.contracts";

interface AccountPageShellProps {
    tab: ProfileTabValue;
    listingSubTab?: "ads" | "services" | "spare-parts";
    messagesView?: ConversationListView;
    conversationId?: string;
    initialConversation?: IConversationDTO | null;
}

export function AccountPageShell({ tab, listingSubTab, messagesView, conversationId, initialConversation }: AccountPageShellProps) {
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
            onLogout={async (options) => {
                markLogoutRedirectBypass();
                void router.replace("/");
                await logout({ skipServerLogout: options?.skipServerLogout });
            }}
            initialTab={tab}
            initialListingSubTab={listingSubTab}
            initialMessagesView={messagesView}
            initialConversationId={conversationId}
            initialConversation={initialConversation}
        />
    );
}
