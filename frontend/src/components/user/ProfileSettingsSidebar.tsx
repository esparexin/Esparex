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
import { Button } from "@/components/ui/button";
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
import { PersonalTab } from "./profile/tabs/PersonalTab";
import { PlansTab } from "./profile/tabs/PlansTab";
import { SettingsTab } from "./profile/tabs/SettingsTab";
import { SmartAlertsTab } from "./profile/tabs/SmartAlertsTab";
import { BusinessTab } from "./profile/tabs/BusinessTab";
import { PurchasesTab } from "./profile/tabs/PurchasesTab";
import { MyListingsTab } from "./profile/tabs/MyListingsTab";
import { SavedAds } from "./SavedAds";
import { AccountMessagesWorkspace } from "@/components/chat/AccountMessagesWorkspace";
import AccountHeader from "./AccountHeader";
import { BusinessStatusBanner } from "@/components/business/BusinessStatusBanner";
import type { ConversationListView } from "@/lib/api/chatApi";
import type { IConversationDTO } from "@shared/contracts/chat.contracts";

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
  const [isMobileMenuView, setIsMobileMenuView] = useState(!initialTab);

  const isBusinessLive = normalizeBusinessStatus(user?.businessStatus, "pending") === "live";

  const { data: adCounts = {} } = useMyListingsStatsQuery({ 
    enabled: activeTab === "mylistings" && !!user,
  });

  const { dynamicPlans } = useDynamicPlans(activeTab, user);
  const { businessData, businessStats, isLoading: businessLoading, isFetched: businessFetched } = useBusiness(
    user,
    undefined,
    { enabled: activeTab === "business" }
  );
  const {
    smartAlertItems,
    savedSearches,
    loading: loadingAlerts,
    createSmartAlert,
    updateSmartAlert,
    toggleSmartAlertStatus,
    deleteSmartAlert,
    deleteSavedSearch,
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
    smartAlertForm, updateSmartAlertForm,
    smartAlertErrors,
    smartAlertGlobalError,
    clearSmartAlertError,
    editingAlertId,
    notificationSettingsError,
    isSavingNotificationSettings,
    handlePhotoSelect,
    handlePhotoDelete,
    handleDeleteAccount,
    handleEditAlert,
    handleCreateAlert,
    handleSaveNotificationSettings,
    resetAlertForm,
  } = useProfileSettings({ user, onUpdateUser, onLogout, createSmartAlert, updateSmartAlert });

  useEffect(() => {
    if (initialTab) {
      const normalizedTab = initialTab as ProfileTabValue;
      setActiveTab(normalizedTab);
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
      "super_admin",
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
  const activeTabLabel =
    visibleProfileTabItems.find((item) => item.value === activeTab)?.label
    ?? PROFILE_TAB_ITEMS.find((item) => item.value === activeTab)?.label;
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

  const handleMobileTabClick = (tab: ProfileTabValue) => {
    setIsMobileMenuView(false);
    handleTabChange(tab);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Rendering logic
  const renderContent = () => {
    const setActiveTabFromChild = (tab: string) => {
      if (PROFILE_TAB_ITEMS.some((item) => item.value === tab)) {
        handleTabChange(tab as ProfileTabValue);
      }
    };

    switch (activeTab) {
      case "personal": return (
        <PersonalTab
          profilePhoto={profilePhoto}
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
          user={user as any}
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
      case "business": return <BusinessTab businessData={businessData} businessStats={businessStats} isLoading={businessLoading} isFetched={businessFetched} navigateTo={(page, adId, category, sellerIdOrBusinessId) => navigateTo(page as UserPage, adId, category, sellerIdOrBusinessId)} />;
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
              radiusKm: alert.radius,
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
    <div className="bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-3 pb-24 md:pb-10">
        {/* DESKTOP HEADER */}
        <div className="mb-6 hidden md:block">
          <AccountHeader />
        </div>

        {/* MOBILE STICKY HEADER — sits below the 100px MobileHeader */}
        <div className="sticky top-[100px] z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 py-2.5 -mx-4 px-4 mb-3 md:hidden transition-all shadow-sm">
          {isMobileMenuView ? (
            <div className="flex items-center gap-2">
              <AccountHeader mobile className="w-full" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuView(true)} className="h-11 w-11 rounded-full hover:bg-gray-200 -ml-1">
                <ChevronRight className="h-5 w-5 rotate-180 text-foreground-secondary" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">
                {activeTabLabel}
              </h1>
            </div>
          )}
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
                    key={item.value} onClick={() => handleTabChange(item.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 font-medium group text-sm
                      ${isActive ? "bg-blue-50 text-link-dark shadow-sm shadow-blue-100 ring-1 ring-blue-200" : "text-foreground-tertiary hover:bg-slate-50 hover:text-foreground"}`}
                  >
                    <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isActive ? "text-link" : "text-foreground-subtle group-hover:text-foreground-tertiary"}`} />
                    <span>{item.label}</span>
                    {renderTabBadge(item.value)}
                    {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                  </button>
                );
              })}
              <Separator className="my-2" />
              <button onClick={() => { void onLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors hover:bg-red-50 text-red-600 font-medium text-sm">
                <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </Card>

            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10"><Crown className="w-16 h-16" /></div>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Current Plan</p>
              <p className="text-lg font-bold flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400 fill-amber-400" />{user?.plan || "Free"}</p>
              {(!user?.plan || user.plan === "Free") && (
                <Button onClick={() => handleTabChange("plans")} size="sm" className="w-full mt-3 bg-white/10 hover:bg-white/20 border-0 text-white text-xs h-9">Upgrade</Button>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="min-h-0">
            <div className="md:hidden">
              {isMobileMenuView ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Crown className="w-20 h-20" /></div>
                    <div className="relative z-10 flex justify-between items-center">
                      <div><p className="text-xs text-blue-100 font-medium mb-1">Your Plan</p><p className="text-xl font-bold flex items-center gap-2">{user?.plan || "Free"} <Crown className="h-4 w-4 text-amber-300 fill-amber-300" /></p></div>
                      {(!user?.plan || user.plan === "Free") && <Button onClick={() => handleMobileTabClick("plans")} size="sm" className="bg-white text-link-dark hover:bg-blue-50 text-xs font-bold px-4 h-10 rounded-full">Upgrade</Button>}
                    </div>
                  </div>
                  <Card className="p-2 border-0 shadow-sm">
                    {visibleProfileTabItems.map((item) => (
                      <button key={item.value} onClick={() => handleMobileTabClick(item.value)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors active:bg-gray-100 text-foreground-secondary border-b border-gray-50 last:border-0">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-muted-foreground"><item.icon className="h-4.5 w-4.5" /></div>
                        <span className="text-sm font-semibold flex-1">{item.label}</span>
                        {renderTabBadge(item.value)}
                        <ChevronRight className="h-4 w-4 text-foreground-subtle" />
                      </button>
                    ))}
                    <Separator className="my-1" />
                    <button onClick={() => { void onLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left active:bg-red-50 text-red-600">
                      <div className="p-2 bg-red-50 rounded-lg"><LogOut className="h-5 w-5" /></div><span className="text-sm font-semibold">Logout</span>
                    </button>
                  </Card>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  {businessStatusBanner}
                  {renderContent()}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              {businessStatusBanner}
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

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

export default ProfileSettingsSidebar;
