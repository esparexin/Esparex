"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import type { User } from "@/types/User";
import {
  PROFILE_TAB_ITEMS,
  PROFILE_TAB_PAGE_ROUTES,
  type ProfileTabValue,
} from "@/config/navigation";

import { useProfileSettings } from "@/hooks/useProfileSettings";
import type { ProfileUser } from "@/components/user/profile/types";

// UI Components
import { Button } from "@esparex/ui";

// Types & Constants
import type { UserPage } from "@/lib/routeUtils";

// Hooks
import { useMyListingsStatsQuery } from "@/hooks/queries/useListingsQuery";
import { type ListingStatsResponse } from "@/lib/api/user/listings";
import { useDynamicPlans } from "@/hooks/useDynamicPlans";
import { useBusiness } from "@/hooks/useBusiness";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { formatPrice, formatDate } from "@/lib/formatters";
import { isApprovedBusiness } from "@/guards/businessGuards";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { buildPublicBrowseRoute } from "@/lib/publicBrowseRoutes";

import { DeleteAccountDialog } from "./profile/dialogs/DeleteAccountDialog";

// Modular Tab Components
import { MobileAccountBottomNav } from "./MobileAccountBottomNav";
import { AccountDesktopSidebar } from "./profile/AccountDesktopSidebar";
import { MoreMenuTab } from "./profile/tabs/MoreMenuTab";
import { PersonalTab } from "./profile/tabs/PersonalTab";
import { PlansTab } from "./profile/tabs/PlansTab";
import { SettingsTab } from "./profile/tabs/SettingsTab";
import { SmartAlertsTab } from "./profile/tabs/SmartAlertsTab";
import { BusinessTab } from "./profile/tabs/BusinessTab";
import { MyListingsTab } from "./profile/tabs/MyListingsTab";
import { SavedAdsTab } from "./profile/tabs/SavedAdsTab";
import { AccountMessagesWorkspace } from "@/components/chat/AccountMessagesWorkspace";
import { AccountHeader } from "./AccountHeader";
import { BusinessStatusBanner } from "@/components/business/BusinessStatusBanner";
import { getStatusBadge } from "./profile/StatusBadge";
import type { ConversationListView } from "@/lib/api/chatApi";
import type { IConversationDTO } from "@esparex/contracts";

interface ProfileSettingsProps {
  navigateTo: (page: UserPage, adId?: string | number, category?: string, businessId?: string, serviceId?: string | number) => void;
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
  initialTab?: string;
  initialListingSubTab?: "ads" | "services" | "spare-parts";
  initialMessagesView?: ConversationListView;
  initialConversationId?: string;
  initialConversation?: IConversationDTO | null;
}

export function ProfileSettingsSidebar({
  navigateTo,
  user,
  onUpdateUser,
  onLogout,
  initialTab,
  initialListingSubTab = "ads",
  initialMessagesView = "active",
  initialConversationId,
  initialConversation,
}: ProfileSettingsProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ProfileTabValue>((initialTab as ProfileTabValue) || "personal");
  const activeConversationId = (params?.conversationId as string) || initialConversationId;
  const isViewingActiveChat = Boolean(activeTab === "messages" && (activeConversationId || (pathname?.startsWith("/account/messages/") && pathname !== "/account/messages")));

  const isBusinessLive = Boolean(user && isApprovedBusiness(user));
  const normalizedBusinessStatus = normalizeBusinessStatus(user?.businessStatus);

  const { data: adCounts = {} } = useMyListingsStatsQuery({ 
    enabled: activeTab === "mylistings" && !!user,
  });

  const { dynamicPlans, isError: plansError } = useDynamicPlans(activeTab, user);
    const { 
      businessData, 
      businessStats, 
      isLoading: businessLoading, 
      isFetched: businessFetched,
      deactivate: deactivateBusiness,
      reactivate: reactivateBusiness,
      close: closeBusiness,
      renew: renewBusiness
    } = useBusiness(
      user,
      undefined,
      { enabled: activeTab === "business" }
    );

  const {
    smartAlertItems,
    savedSearches,
    loading: loadingAlerts,
    toggleSmartAlertStatus,
    deleteSmartAlert,
    deleteSavedSearch,
    smartAlertForm, updateSmartAlertForm,
    smartAlertErrors,
    smartAlertGlobalError,
    clearSmartAlertError,
    editingAlertId,
    handleEditAlert,
    handleCreateAlert,
    resetAlertForm,
  } = useSmartAlerts(activeTab === "smartalerts");
  const chatUnreadCount = useChatUnreadCount(user?.id ?? null, !!user);

    const {
        showDeleteDialog, setShowDeleteDialog,
        deleteConfirmText, setDeleteConfirmText,
        deleteReason, setDeleteReason,
        deleteFeedback, setDeleteFeedback,
        deleteAccountErrors,
        deleteAccountGlobalError,
        handleDeleteAccount,
        setShowPlanDialog,
        setSelectedPlan,
    } = useProfileSettings({ user, onLogout });

  useEffect(() => {
    if (initialTab) {
      const normalizedTab = initialTab as ProfileTabValue;
      void (async () => { setActiveTab(normalizedTab); })();
    }
  }, [initialTab]);

  // Event Handlers
  const handleTabChange = (value: ProfileTabValue) => {
    setActiveTab(value);
    const targetPage = PROFILE_TAB_PAGE_ROUTES[value];
    if (targetPage) {
      navigateTo(targetPage);
    }
  };

  const renderTabBadge = (value: ProfileTabValue) => {
    if (value !== "messages" || chatUnreadCount <= 0) return null;
    return (
      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-2xs font-bold text-white">
        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
      </span>
    );
  };

  const visibleProfileTabItems = PROFILE_TAB_ITEMS.filter((item) => {
    if (!user) return false;
    const normalizedRole = (user.role || "user").toLowerCase();
    const allowedRoles = [
      "user",
      "business",
      "admin",
      "superadmin",
      "moderator",
      "editor",
      "viewer",
      "user_manager",
      "finance_manager",
      "content_moderator",
      "custom",
    ];
    if (!allowedRoles.includes(normalizedRole)) return false;
    if (item.businessOnly && item.value !== "business") {
      return isBusinessLive;
    }
    return true;
  });
  const businessStatusBanner = user?.businessStatus ? (
    <BusinessStatusBanner
      status={user.businessStatus}
      onAction={user.businessStatus === "rejected"
        ? () => navigateTo("business-register")
        : () => handleTabChange("business")
      }
    />
  ) : null;

  // Rendering logic
  const renderContent = () => {
    const setActiveTabFromChild = (tab: string) => {
      if (PROFILE_TAB_ITEMS.some((item) => item.value === tab)) {
        handleTabChange(tab as ProfileTabValue);
      }
    };

    switch (activeTab) {
      case "more": return <MoreMenuTab user={user} onTabChange={handleTabChange} onLogout={onLogout} renderTabBadge={renderTabBadge} />;
      case "personal": return (
        <PersonalTab
          user={user}
          onUpdateUser={onUpdateUser}
        />
      );
      case "mylistings": return (
        <MyListingsTab
          adCounts={adCounts as ListingStatsResponse}
          user={user}
          navigateTo={(page, adId, category, businessId, serviceId) => navigateTo(page as UserPage, adId, category, businessId as string, serviceId as string)}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          businessStatus={normalizedBusinessStatus}
          onRegisterBusiness={() => navigateTo("business-register")}
          initialSubTab={initialListingSubTab}
        />
      );
      case "messages": return (
        <AccountMessagesWorkspace
          currentUserId={user?.id ?? ""}
          conversationId={initialConversationId}
          initialView={initialMessagesView}
          initialConversation={initialConversation}
        />
      );
      case "saved": return (
        <SavedAdsTab navigateTo={(page) => navigateTo(page as UserPage)} />
      );
      case "plans": return <PlansTab dynamicPlans={dynamicPlans} isError={plansError} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} initialTab="OVERVIEW" />;
      case "buyplans": return <PlansTab dynamicPlans={dynamicPlans} isError={plansError} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} initialTab="BUY_PLANS" />;
      case "business": return (
        <BusinessTab 
          businessData={businessData} 
          businessStats={businessStats} 
          isLoading={businessLoading} 
          isFetched={businessFetched} 
          navigateTo={(page, adId, category, sellerIdOrBusinessId) => navigateTo(page as UserPage, adId, category, sellerIdOrBusinessId)}
          onDeactivate={deactivateBusiness}
          onReactivate={reactivateBusiness}
          onClose={closeBusiness}
          onRenew={renewBusiness}
        />
      );

      case "settings": return (
        <SettingsTab
          user={user}
          onUpdateUser={onUpdateUser}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      );
      case "smartalerts": return (
        <SmartAlertsTab
          smartAlerts={smartAlertItems}
          savedSearches={savedSearches}
          smartAlertForm={smartAlertForm}
          updateSmartAlertForm={updateSmartAlertForm}
          handleCreateAlert={handleCreateAlert}
          handleToggleAlertStatus={(id) => { void toggleSmartAlertStatus(id); }}
          handleDeleteAlert={(id) => { void deleteSmartAlert(id); }}
          handleDeleteSavedSearch={(id) => {
            void deleteSavedSearch(id);
          }}
          handleViewAlertMatches={(alert) => {
            void router.push(buildPublicBrowseRoute({
              type: "ad",
              q: alert.keywords,
              category: alert.category,
              locationId: alert.locationId,
              location: alert.locationId ? undefined : alert.location,
              radiusKm: alert.radiusKm,
            }));
          }}
          handleEditAlert={(alert) => handleEditAlert(alert)}
          editingAlertId={editingAlertId}
          resetAlertForm={resetAlertForm}
          setActiveTab={setActiveTabFromChild} loading={loadingAlerts}
          smartAlertErrors={smartAlertErrors}
          smartAlertGlobalError={smartAlertGlobalError}
          clearSmartAlertError={clearSmartAlertError}
        />
      );
      case "purchases": return <PlansTab dynamicPlans={dynamicPlans} isError={plansError} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} initialTab="INVOICES" />;
      default: return null;
    }
  };

  return (
    <div className={`bg-gray-50 ${isViewingActiveChat ? "pb-0 overflow-hidden h-[calc(100dvh-6.25rem)]" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"} md:pb-0 md:h-auto md:overflow-visible`}>
      {/* UNIFIED RESPONSIVE ACCOUNT HEADER (Single Instance) */}
      {!isViewingActiveChat && (
        <AccountHeader
          activeTab={activeTab}
          onBackToMenu={() => handleTabChange("more")}
          rightElement={
            activeTab === "mylistings" ? (
              <Button
                size="sm"
                onClick={() => navigateTo("post-ad")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-semibold rounded-lg shadow-sm"
              >
                + Post Ad
              </Button>
            ) : activeTab === "plans" ? (
              <div className="text-tiny font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-full shrink-0">
                Current: <span className="font-bold text-slate-800">{user?.plan || "Free"}</span>
              </div>
            ) : undefined
          }
        />
      )}

      <div className={`w-full max-w-6xl mx-auto ${isViewingActiveChat || activeTab === "more" ? "p-0" : "px-3.5 sm:px-6 pt-1"} ${isViewingActiveChat ? "h-full flex flex-col" : ""} md:px-6 md:py-6 md:h-auto`}>
        {/* LAYOUT CONTAINER */}
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] md:gap-6 flex-1 min-h-0">
          {/* LEFT SIDEBAR (Desktop Only) */}
          <AccountDesktopSidebar
            items={visibleProfileTabItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            renderTabBadge={renderTabBadge}
            onLogout={() => { void onLogout(); }}
            user={user}
          />

          {/* MAIN CONTENT AREA */}
          <section className="min-h-0 bg-transparent flex-1 flex flex-col h-full">
            {businessStatusBanner}
            {renderContent()}
          </section>
        </div>
      </div>

      {!isViewingActiveChat && (
        <MobileAccountBottomNav activeTab={activeTab} onTabChange={handleTabChange} unreadCount={chatUnreadCount} />
      )}

      {/* Extracted Dialogs */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        deleteFeedback={deleteFeedback}
        setDeleteFeedback={setDeleteFeedback}
        onDelete={handleDeleteAccount}
        deleteAccountErrors={deleteAccountErrors}
        deleteAccountGlobalError={deleteAccountGlobalError}
      />
    </div>
  );


}
