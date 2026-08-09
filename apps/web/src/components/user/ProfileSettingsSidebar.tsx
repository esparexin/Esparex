"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  LogOut,
} from "@/icons/IconRegistry";

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


// Dialogs
import { DeleteAccountDialog } from "./profile/dialogs/DeleteAccountDialog";

// Modular Tab Components

import { MobileAccountBottomNav } from "./MobileAccountBottomNav";
import { MoreMenuTab } from "./profile/tabs/MoreMenuTab";
import { PersonalTab } from "./profile/tabs/PersonalTab";
import { PlansTab } from "./profile/tabs/PlansTab";
import { SettingsTab } from "./profile/tabs/SettingsTab";
import { SmartAlertsTab } from "./profile/tabs/SmartAlertsTab";
import { BusinessTab } from "./profile/tabs/BusinessTab";
import { MyListingsTab } from "./profile/tabs/MyListingsTab";
import { AccountMessagesWorkspace } from "@/components/chat/AccountMessagesWorkspace";
import { AccountHeader } from "./AccountHeader";
import { AccountNavItemList } from "./AccountNavItemList";
import { BusinessStatusBanner } from "@/components/business/BusinessStatusBanner";
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
  const [activeTab, setActiveTab] = useState<ProfileTabValue>((initialTab as ProfileTabValue) || "personal");

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
        showPlanDialog, setShowPlanDialog,
        selectedPlan, setSelectedPlan,
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

  // Helper Functions

  const getStatusBadge = (status: string, _adId?: string | number) => {
    const renderBadge = (label: string, className: string) => (
      <span className={`px-2 py-0.5 rounded text-2xs uppercase tracking-wider font-semibold ${className}`}>
        {label}
      </span>
    );

    switch (status?.toLowerCase()) {
      case "live":
      case "active":
      case "approved":
      case "published":
        return renderBadge("Live", "bg-emerald-100 text-emerald-700");
      case "pending":
        return renderBadge("Pending", "bg-amber-100 text-amber-700");
      case "sold":
        return renderBadge("Sold", "bg-blue-100 text-link-dark");
      case "rejected":
        return renderBadge("Rejected", "bg-red-100 text-red-700");
      case "expired":
        return renderBadge("Expired", "bg-slate-200 text-foreground-secondary");
      case "deactivated":
        return renderBadge("Deactivated", "bg-orange-100 text-orange-700");
      default:
        return renderBadge(status || "Unknown", "bg-gray-100 text-foreground-tertiary");
    }
  };

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
        // Layout constraint: Forms require a narrower max-width (xl) for readability and UX
        <div className="max-w-xl mx-auto w-full px-2 sm:px-0">
          <PersonalTab
            user={user}
            onUpdateUser={onUpdateUser}
          />
        </div>
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
      case "plans": return <PlansTab dynamicPlans={dynamicPlans} isError={plansError} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} initialTab="OVERVIEW" />;
      case "buyplans": return <PlansTab dynamicPlans={dynamicPlans} isError={plansError} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} initialTab="BUY_PLANS" />;
      case "business": return (
        // Layout constraint: Forms require a narrower max-width (xl) for readability and UX
        <div className="max-w-xl mx-auto w-full px-2 sm:px-0">
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
        </div>
      );

      case "settings": return (
        <SettingsTab
          user={user}
          onUpdateUser={onUpdateUser}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      );
      case "smartalerts": return (
        // Layout constraint: Lists/tables need wider space than forms, but constrained (4xl) to avoid stretching too far
        <div className="max-w-4xl mx-auto w-full px-2 sm:px-0">
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
        </div>
      );
      case "purchases": return <PlansTab dynamicPlans={dynamicPlans} isError={plansError} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} initialTab="INVOICES" />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* UNIFIED RESPONSIVE ACCOUNT HEADER (Single Instance) */}
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

      <div className="w-full max-w-7xl mx-auto pt-1 md:py-6">
        {/* LAYOUT CONTAINER */}
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] md:gap-6">
          {/* LEFT SIDEBAR (Desktop Only) */}
          <aside className="hidden md:block space-y-1" aria-label="Account navigation">
            <div className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-xs">
              <AccountNavItemList
                items={visibleProfileTabItems}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                renderTabBadge={renderTabBadge}
                variant="sidebar"
              />
              <Separator className="my-2" />
              <button
                type="button"
                onClick={() => { void onLogout(); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors hover:bg-red-50 text-red-600 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
                <span>Log out</span>
              </button>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10"><Crown className="w-16 h-16" /></div>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Current Plan</p>
              <p className="text-base font-bold flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400 fill-amber-400" />{user?.plan || "Free"}</p>
              {(!user?.plan || user.plan === "Free") && (
                <Button type="button" onClick={() => handleTabChange("plans")} size="sm" className="w-full mt-3 bg-white/10 hover:bg-white/20 border-0 text-white text-xs h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2">Upgrade</Button>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <section className="min-h-0 bg-transparent">
            {businessStatusBanner}
            {renderContent()}
          </section>
        </div>
      </div>

      <MobileAccountBottomNav activeTab={activeTab} onTabChange={handleTabChange} unreadCount={chatUnreadCount} />

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
