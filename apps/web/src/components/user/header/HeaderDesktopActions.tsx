"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, TrendingUp } from "@esparex/ui";
import type { User } from "@esparex/contracts";
import type { UserPage } from "@/lib/routeUtils";
import {
  getNavigationItems,
  getNavigationSections,
  type ResolvedNavigationItem,
} from "@/config/navigation";
import { NotificationBellDropdown } from "@/components/user/NotificationBellDropdown";
import { usePostAdNavigation } from "@/hooks/usePostAdNavigation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canRegisterBusiness, isApprovedBusiness } from "@/guards/businessGuards";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import type { NotificationResponse } from "@/lib/api/user/notifications";
import { HeaderAccountMenu } from "./HeaderAccountMenu";
import { HeaderBusinessButton } from "./HeaderBusinessButton";

export interface HeaderDesktopActionsProps {
  isMounted: boolean;
  isAuthLoading: boolean;
  isLoggedIn: boolean;
  user?: User | null;
  onLogout?: () => void;
  onShowLogin?: () => void;
  navigateTo: (page: UserPage) => void;
  notificationsData?: NotificationResponse;
  unreadCount: number;
  onRefreshNotifications: () => Promise<unknown>;
}

export function HeaderDesktopActions({
  isMounted,
  isAuthLoading,
  isLoggedIn,
  user = null,
  onLogout = () => {},
  onShowLogin,
  navigateTo,
  notificationsData,
  unreadCount,
  onRefreshNotifications,
}: HeaderDesktopActionsProps) {
  const router = useRouter();

  const businessStatus = normalizeBusinessStatus(user?.businessStatus, "none");
  const isBusinessLive = Boolean(user && isApprovedBusiness(user));
  const shouldShowPendingReview = businessStatus === "pending" && Boolean(user?.businessId);
  const canRegister = Boolean(user && canRegisterBusiness(user));
  const safeProfilePhoto = useMemo(
    () => toSafeImageSrc(user?.profilePhoto, ""),
    [user?.profilePhoto]
  );

  const { isBackendUp, handlePostAdClick } = usePostAdNavigation({
    isLoggedIn,
    onShowLogin,
    navigateTo: (path) => {
      navigateTo(path as UserPage);
    },
  });

  const { account: profileMenuItems } = getNavigationSections(
    getNavigationItems("profile-dropdown", { isLoggedIn, user: user ?? null })
  );

  const handleMenuItemClick = (item: ResolvedNavigationItem) => {
    if (item.href) {
      void router.push(item.href);
      return;
    }
    if (item.page) {
      navigateTo(item.page);
    }
  };

  return (
    <div className="flex items-center gap-3 ml-auto">
      {!isMounted || isAuthLoading ? (
        <>
          <div className="hidden lg:flex h-9 w-32 rounded-xl bg-muted animate-pulse border border-border" aria-hidden="true" />
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse border border-border" aria-hidden="true" />
        </>
      ) : isLoggedIn ? (
        <>
          <HeaderBusinessButton
            isBusinessLive={isBusinessLive}
            shouldShowPendingReview={shouldShowPendingReview}
            canRegister={canRegister}
            businessStatus={businessStatus}
            onNavigate={navigateTo}
          />
          <NotificationBellDropdown
            notificationsData={notificationsData}
            unreadCount={unreadCount}
            onRefresh={onRefreshNotifications}
            variant="desktop"
          />
          <HeaderAccountMenu
            user={user}
            safeProfilePhoto={safeProfilePhoto}
            profileMenuItems={profileMenuItems}
            onMenuItemClick={handleMenuItemClick}
            onLogout={onLogout}
          />
        </>
      ) : (
        <Button variant="ghost" size="sm" onClick={onShowLogin} className="cursor-pointer">
          Login
        </Button>
      )}

      <Button
        size="sm"
        onClick={handlePostAdClick}
        disabled={!isBackendUp}
        className="rounded-full px-4 gap-2 shadow-sm hover:shadow-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title={!isBackendUp ? "Service temporarily unavailable" : "Post a new ad"}
      >
        <TrendingUp className="h-4 w-4" /> Post Ad
      </Button>
    </div>
  );
}
