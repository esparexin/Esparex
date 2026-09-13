"use client";

import { useRouter } from "next/navigation";
import { Ban, Eye, PlayCircle, Search, Shield, User as UserIcon } from "@esparex/ui";
import { AdminActionMenu, type ActionMenuItem } from "@/components/layout/AdminActionMenu";
import {
    isManagedUserActive,
    type ManagedUser,
    type UserActionType,
} from "@/components/system/users/userManagement";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";

interface UserActionMenuProps {
    user: ManagedUser;
    onOpenDetails: (user: ManagedUser) => void;
    onOpenAction: (type: UserActionType, user: ManagedUser) => void;
}

export function UserActionMenu({
    user,
    onOpenDetails,
    onOpenAction,
}: UserActionMenuProps) {
    const router = useRouter();
    const isActive = isManagedUserActive(user.status);

    const items: ActionMenuItem[] = [
        {
            label: "View Profile",
            icon: Eye,
            onClick: () => router.push(ADMIN_UI_ROUTES.userById(user.id)),
        },
        {
            label: "View Ads",
            icon: Search,
            onClick: () => router.push(ADMIN_UI_ROUTES.ads({ status: "all", sellerId: user.id })),
        },
        {
            label: "Quick Details",
            icon: UserIcon,
            onClick: () => onOpenDetails(user),
        },
        {
            label: user.isVerified ? "Revoke Verification" : "Verify User",
            icon: Shield,
            onClick: () => onOpenAction(user.isVerified ? "unverify" : "verify", user),
        },
        isActive
            ? {
                  label: "Block User",
                  icon: Ban,
                  onClick: () => onOpenAction("ban", user),
                  variant: "danger",
              }
            : {
                  label: "Reactivate Account",
                  icon: PlayCircle,
                  onClick: () => onOpenAction("activate", user),
                  variant: "default",
              },
    ];

    return (
        <AdminActionMenu
            items={items}
            align="end"
            ariaLabel={`Actions for ${user.name || user.mobile}`}
        />
    );
}

