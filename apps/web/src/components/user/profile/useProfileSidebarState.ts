"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import type { ProfileTabValue } from "@/config/navigation";
import { PROFILE_TAB_ITEMS, PROFILE_TAB_PAGE_ROUTES } from "@/config/navigation";
import type { ProfileUser } from "@/components/user/profile/types";
import type { UserPage } from "@/lib/routeUtils";
import { useMyListingsStatsQuery } from "@/hooks/queries/useListingsQuery";
import { useDynamicPlans } from "@/hooks/useDynamicPlans";
import { useBusiness } from "@/hooks/useBusiness";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { isApprovedBusiness } from "@/guards/businessGuards";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { useProfileSettings } from "@/hooks/useProfileSettings";

interface UseProfileSidebarStateProps {
  user: ProfileUser | null;
  initialTab?: string;
  initialConversationId?: string;
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
  navigateTo: (page: UserPage, adId?: string | number, category?: string, businessId?: string, serviceId?: string | number) => void;
}

export function useProfileSidebarState({
  user,
  initialTab,
  initialConversationId,
  onLogout,
  navigateTo,
}: UseProfileSidebarStateProps) {
  const params = useParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ProfileTabValue>((initialTab as ProfileTabValue) || "personal");
  const [isPersonalTabDirty, setIsPersonalTabDirty] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<ProfileTabValue | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const activeConversationId = (params?.conversationId as string) || initialConversationId;
  const isViewingActiveChat = Boolean(
    activeTab === "messages" &&
      (activeConversationId || (pathname?.startsWith("/account/messages/") && pathname !== "/account/messages"))
  );

  const isBusinessLive = Boolean(user && isApprovedBusiness(user));
  const normalizedBusinessStatus = normalizeBusinessStatus(user?.businessStatus);

  const { data: adCounts = {} } = useMyListingsStatsQuery({
    enabled: activeTab === "mylistings" && !!user,
  });

  const { dynamicPlans, isError: plansError } = useDynamicPlans(activeTab, user);
  const businessState = useBusiness(user, undefined, { enabled: activeTab === "business" });
  const smartAlertsState = useSmartAlerts(activeTab === "smartalerts");
  const chatUnreadCount = useChatUnreadCount(user?.id ?? null, !!user);

  const {
    showDeleteDialog,
    setShowDeleteDialog,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteReason,
    setDeleteReason,
    deleteFeedback,
    setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    isDeleting,
    handleDeleteAccount,
    setShowPlanDialog,
    setSelectedPlan,
  } = useProfileSettings({ user, onLogout });

  useEffect(() => {
    if (initialTab) {
      const normalizedTab = initialTab as ProfileTabValue;
      void (async () => {
        setActiveTab(normalizedTab);
      })();
    }
  }, [initialTab]);

  const handleTabChange = (value: ProfileTabValue) => {
    if (activeTab === "personal" && isPersonalTabDirty && value !== "personal") {
      setPendingTabChange(value);
      setShowUnsavedModal(true);
      return;
    }
    setActiveTab(value);
    const targetPage = PROFILE_TAB_PAGE_ROUTES[value];
    if (targetPage) {
      navigateTo(targetPage);
    }
  };

  const handleConfirmDiscard = () => {
    setIsPersonalTabDirty(false);
    setShowUnsavedModal(false);
    if (pendingTabChange) {
      setActiveTab(pendingTabChange);
      const targetPage = PROFILE_TAB_PAGE_ROUTES[pendingTabChange];
      if (targetPage) {
        navigateTo(targetPage);
      }
      setPendingTabChange(null);
    }
  };

  const visibleProfileTabItems = PROFILE_TAB_ITEMS.filter((item) => {
    if (!user) return false;
    const normalizedRole = (user.role || "user").toLowerCase();
    const allowedRoles = ["user", "business", "admin", "superadmin", "moderator", "editor", "viewer", "user_manager", "finance_manager", "content_moderator", "custom"];
    if (!allowedRoles.includes(normalizedRole)) return false;
    return item.businessOnly && item.value !== "business" ? isBusinessLive : true;
  });

  return {
    activeTab,
    isViewingActiveChat,
    isPersonalTabDirty,
    setIsPersonalTabDirty,
    showUnsavedModal,
    setShowUnsavedModal,
    handleTabChange,
    handleConfirmDiscard,
    visibleProfileTabItems,
    isBusinessLive,
    normalizedBusinessStatus,
    adCounts,
    chatUnreadCount,
    plansState: { dynamicPlans, isError: plansError, setSelectedPlan, setShowPlanDialog },
    businessState,
    smartAlertsState,
    deleteAccountState: { showDeleteDialog, setShowDeleteDialog, deleteConfirmText, setDeleteConfirmText, deleteReason, setDeleteReason, deleteFeedback, setDeleteFeedback, deleteAccountErrors, deleteAccountGlobalError, isDeleting, handleDeleteAccount },
  };
}
