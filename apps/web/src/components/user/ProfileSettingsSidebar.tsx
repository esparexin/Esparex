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
import { Card } from "@/components/ui/card";
import { Button } from "@esparex/ui";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  ChevronRight,
  LogOut,
} from "@/components/ui/icons";

// Types & Constants
import type { UserPage } from "@/lib/routeUtils";

// Hooks
import { useMyListingsStatsQuery } from "@/hooks/queries/useListingsQuery";
import { type ListingStatsResponse } from "@/lib/api/user/listings";
import { useDynamicPlans } from "@/hooks/useDynamicPlans";
import { useBusiness } from "@/hooks/useBusiness";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { usePurchases } from "@/hooks/usePurchases";
import { useChatUnreadCount } from "@/hooks/useChatUnreadCount";
import { formatPrice, formatDate } from "@/lib/formatters";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { buildPublicBrowseRoute } from "@/lib/publicBrowseRoutes";
import { PROFILE_PHOTO_ACCEPT } from "@/lib/uploads/profilePhotoUpload";

// Dialogs
import { DeleteAccountDialog } from "./profile/dialogs/DeleteAccountDialog";
import { PlanPurchaseDialog } from "./profile/dialogs/PlanPurchaseDialog";
import { PhotoOptionsDialog } from "./profile/dialogs/PhotoOptionsDialog";

// Modular Tab Components
import { MobileAccountHeader } from "./MobileAccountHeader";
import { MobileAccountBottomNav } from "./MobileAccountBottomNav";
import { MoreMenuTab } from "./profile/tabs/MoreMenuTab";
import { PersonalTab } from "./profile/tabs/PersonalTab";
import { PlansTab } from "./profile/tabs/PlansTab";
import { SettingsTab } from "./profile/tabs/SettingsTab";
import { SmartAlertsTab } from "./profile/tabs/SmartAlertsTab";
import { BusinessTab } from "./profile/tabs/BusinessTab";
import { PurchasesTab } from "./profile/tabs/PurchasesTab";
import { MyListingsTab } from "./profile/tabs/MyListingsTab";
import { SavedAds } from "./SavedAds";
import { AccountMessagesWorkspace } from "@/components/chat/AccountMessagesWorkspace";
import { AccountHeader } from "./AccountHeader";
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

  const isBusinessLive = normalizeBusinessStatus(user?.businessStatus, "pending") === "live";

  const { data: adCounts = {} } = useMyListingsStatsQuery({ 
    enabled: activeTab === "mylistings" && !!user,
  });

  const { dynamicPlans } = useDynamicPlans(activeTab, user);
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
  const { purchaseHistory, loading: loadingPurchased } = usePurchases(activeTab === "purchases");
  const chatUnreadCount = useChatUnreadCount(user?.id ?? null, !!user);

  const {
    formData, setFormData,
    profilePhoto,
    profileErrors, setProfileErrors,
    profileGlobalError, setProfileGlobalError,
    isSavingProfile,
    handleSaveProfile,
    notifications, setNotifications,
    mobileVisibility, setMobileVisibility,
    showPhotoDialog, setShowPhotoDialog,
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    deleteReason, setDeleteReason,
    deleteFeedback, setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    showPlanDialog, setShowPlanDialog,
    selectedPlan, setSelectedPlan,
    notificationSettingsError,
    isSavingNotificationSettings,
    handlePhotoSelect,
    handlePhotoDelete,
    handleDeleteAccount,
    handleSaveNotificationSettings,
  } = useProfileSettings({ user, onUpdateUser, onLogout });

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
    const allowedRoles = [
      "user",
      "business",
      "admin",
      "superAdmin",
      "moderator",
      "editor",
      "viewer",
      "user_manager",
      "finance_manager",
      "content_moderator",
      "custom",
    ];
    if (!allowedRoles.includes(user.role)) return false;
    if (item.businessOnly) {
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
        <PersonalTab
          profilePhoto={profilePhoto}
          mobile={user?.mobile || ""}
          isMobileVerified={user?.isPhoneVerified}
          formData={formData}
          setFormData={(data) => {
            setFormData(data);
            if (profileGlobalError) setProfileGlobalError(null);
          }}
          mobileVisibility={mobileVisibility} setMobileVisibility={(v) => setMobileVisibility(v)}
          handleSaveProfile={handleSaveProfile} onPhotoClick={() => setShowPhotoDialog(true)}
          handlePhotoDelete={handlePhotoDelete}
          profileErrors={profileErrors}
          profileGlobalError={profileGlobalError}
          isSavingProfile={isSavingProfile}
          clearProfileError={(field) => {
            setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
            if (profileGlobalError) setProfileGlobalError(null);
          }}
        />
      );
      case "mylistings": return (
        <MyListingsTab
          adCounts={adCounts as ListingStatsResponse}
          user={user}
          navigateTo={(page, adId, category, businessId, serviceId) => navigateTo(page as UserPage, adId, category, businessId as string, serviceId as string)}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          isBusinessApproved={isBusinessLive}
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
      case "saved": return <SavedAds navigateTo={(page, adId) => navigateTo(page as UserPage, adId)} />;
      case "plans": return <PlansTab dynamicPlans={dynamicPlans} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} />;
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
          notifications={notifications}
          setNotifications={setNotifications}
          handleSaveNotificationSettings={handleSaveNotificationSettings}
          isSavingNotificationSettings={isSavingNotificationSettings}
          notificationSettingsError={notificationSettingsError}
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
      case "purchases": return <PurchasesTab purchaseHistory={purchaseHistory} formatDate={formatDate} formatCurrency={formatPrice} setActiveTab={setActiveTabFromChild} loading={loadingPurchased} />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <MobileAccountHeader activeTab={activeTab} onBackToMenu={() => handleTabChange("more")} />
      
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-3 pb-20 md:pb-10">
        {/* DESKTOP HEADER */}
        <div className="mb-6 hidden md:block">
          <AccountHeader />
        </div>

        {/* LAYOUT CONTAINER */}
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] md:gap-6">
          {/* LEFT SIDEBAR (Desktop Only) */}
          <aside className="hidden md:block space-y-1">
            <Card className="p-2 border-0 shadow-sm bg-white/80 backdrop-blur">
              {visibleProfileTabItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTabChange(item.value)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 font-medium group text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                      ${isActive ? "bg-blue-50 text-link-dark shadow-sm shadow-blue-100 ring-1 ring-blue-200" : "text-foreground-tertiary hover:bg-slate-50 hover:text-foreground"}`}
                  >
                    <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isActive ? "text-link" : "text-foreground-subtle group-hover:text-foreground-tertiary"}`} />
                    <span>{item.label}</span>
                    {renderTabBadge(item.value)}
                    {isActive && <ChevronRight className="h-4 w-4 opacity-50 ml-auto" />}
                  </button>
                );
              })}
              <Separator className="my-2" />
              <button
                type="button"
                onClick={() => { void onLogout(); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors hover:bg-red-50 text-red-600 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </Card>

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
          <main className="min-h-0">
            {businessStatusBanner}
            {renderContent()}
          </main>
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
      <PlanPurchaseDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} selectedPlan={selectedPlan} plans={dynamicPlans} formatCurrency={formatPrice} onConfirm={() => setShowPlanDialog(false)} />
      <PhotoOptionsDialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog} onPhotoSelect={() => document.getElementById('photo-upload')?.click()} onPhotoDelete={handlePhotoDelete} />

      {/* Hidden File Input for Photo Upload */}
      <input type="file" id="photo-upload" name="profile-photo-upload" className="hidden" accept={PROFILE_PHOTO_ACCEPT} onChange={handlePhotoSelect} />
    </div>
  );

}
