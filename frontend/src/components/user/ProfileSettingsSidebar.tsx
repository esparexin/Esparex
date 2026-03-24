"use client";
import { useState, useEffect } from "react";
import { notify } from "@/lib/notify";
import type { User } from "@/types/User";
import {
  PROFILE_TAB_ITEMS,
  PROFILE_TAB_PAGE_ROUTES,
  type ProfileTabValue,
} from "@/config/navigation";

// Account settings hook (uses legacy profile hook)
import {
  useProfileSettings,
  type ProfileUser,
  type SmartAlertItem,
  toSmartAlertItem,
} from "@/hooks/useProfileSettings";

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
import { useMyAds } from "@/hooks/useMyAds";
import type { MyServicesStatus } from "@/hooks/useMyServices";
import { useDynamicPlans } from "@/hooks/useDynamicPlans";
import { useBusiness } from "@/hooks/useBusiness";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { usePurchases } from "@/hooks/usePurchases";
import { formatPrice, formatDate } from "@/utils/formatters";

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
import { MyAdsTab } from "./profile/tabs/MyAdsTab";
import { MyServicesTab } from "./profile/tabs/MyServicesTab";
import { MySparePartsTab } from "./profile/tabs/MySparePartsTab";
import { SavedAds } from "./SavedAds";
import AccountHeader from "./AccountHeader";
import { BusinessStatusBanner } from "@/components/business/BusinessStatusBanner";

interface ProfileSettingsProps {
  navigateTo: (page: UserPage, adId?: string | number, category?: string, businessId?: string, serviceId?: string | number) => void;
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
  onLogout: () => void;
  initialTab?: string;
}

export function ProfileSettingsSidebar({ navigateTo, user, onUpdateUser, onLogout, initialTab }: ProfileSettingsProps) {
  // Navigation & Shell State
  const [activeTab, setActiveTab] = useState<ProfileTabValue>((initialTab as ProfileTabValue) || "personal");
  const [isMobileMenuView, setIsMobileMenuView] = useState(!initialTab);

  // Custom Hooks for Data Fetching
  const [myAdsTab, setMyAdsTab] = useState<"live" | "pending" | "rejected" | "sold" | "expired" | "deactivated">("live");
  const [myServicesTab] = useState<MyServicesStatus>("live");

  // Custom Hooks for Data Fetching
  const {
    myAds, adCounts, loadingAds, fetchMyAds,
    handleDeleteAd, handleMarkAsSold
  } = useMyAds(activeTab, user, myAdsTab);

  // useMyServices is now wired directly in MyServicesTab
  const { dynamicPlans } = useDynamicPlans(activeTab);
  const { businessData, businessStats, isLoading: businessLoading, isFetched: businessFetched } = useBusiness(user);
  const {
    smartAlerts,
    savedSearches,
    loading: loadingAlerts,
    createSmartAlert,
    toggleSmartAlertStatus,
    deleteSavedSearch,
  } = useSmartAlerts();
  const { purchaseHistory, loading: loadingPurchased } = usePurchases();

  const {
    formData, setFormData,
    profilePhoto,
    profileErrors, setProfileErrors,
    profileGlobalError, setProfileGlobalError,
    isSavingProfile,
    handleSaveProfile,
    notifications, setNotifications,
    mobileVisibility, setMobileVisibility,
    mobileRequests, setMobileRequests,
    showPhotoDialog, setShowPhotoDialog,
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    showPlanDialog, setShowPlanDialog,
    selectedPlan, setSelectedPlan,
    showBusinessEditForm, setShowBusinessEditForm,
    newAlertName, setNewAlertName,
    newAlertKeywords, setNewAlertKeywords,
    newAlertCategory, setNewAlertCategory,
    newAlertLocation, setNewAlertLocation,
    newAlertRadius, setNewAlertRadius,
    createAlertEmail, setCreateAlertEmail,
    createAlertErrors, setCreateAlertErrors,
    createAlertGlobalError, setCreateAlertGlobalError,
    alertPreferences, setAlertPreferences,
    alertPreferencesError,
    isSavingAlertPreferences,
    handlePhotoSelect,
    handlePhotoDelete,
    handleDeleteAccount,
    handleCreateAlert,
    handleSaveAlertPreferences,
  } = useProfileSettings({ user, onUpdateUser, onLogout, createSmartAlert });

  useEffect(() => {
    if (initialTab) {
      const normalizedTab = initialTab as ProfileTabValue;
      setActiveTab(normalizedTab);
    }
  }, [initialTab]);

  // Event Handlers
  const handleTabChange = (value: ProfileTabValue) => {
    const targetPage = PROFILE_TAB_PAGE_ROUTES[value];
    if (targetPage) {
      navigateTo(targetPage);
    } else {
      setActiveTab(value);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', value);
      window.history.pushState({}, '', newUrl);
    }
  };

  // Helper Functions

  const getStatusBadge = (status: string, _adId?: string | number) => {
    const renderBadge = (label: string, className: string) => (
      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${className}`}>
        {label}
      </span>
    );

    switch (status?.toLowerCase()) {
      case "live":
        return renderBadge("Live", "bg-emerald-100 text-emerald-700");
      case "pending":
        return renderBadge("Pending", "bg-amber-100 text-amber-700");
      case "sold":
        return renderBadge("Sold", "bg-blue-100 text-blue-700");
      case "rejected":
        return renderBadge("Rejected", "bg-red-100 text-red-700");
      case "expired":
        return renderBadge("Expired", "bg-slate-200 text-slate-700");
      case "deactivated":
        return renderBadge("Deactivated", "bg-orange-100 text-orange-700");
      default:
        return renderBadge(status || "Unknown", "bg-gray-100 text-gray-600");
    }
  };

  const handleMobileTabClick = (tab: ProfileTabValue) => {
    setActiveTab(tab);
    setIsMobileMenuView(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Rendering logic
  const renderContent = () => {
    const smartAlertItems: SmartAlertItem[] = smartAlerts.map(toSmartAlertItem);
    const setActiveTabFromChild = (tab: string) => setActiveTab(tab as ProfileTabValue);
    const handleDeleteAdForTab = async (id: string | number): Promise<void> => {
      await handleDeleteAd(id);
    };
    const handleMarkAsSoldForTab = async (
      id: string | number,
      soldReason?: "sold_on_platform" | "sold_outside" | "no_longer_available"
    ): Promise<void> => {
      await handleMarkAsSold({ id, soldReason });
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
          mobileRequests={mobileRequests} setMobileRequests={setMobileRequests}
          handleSaveProfile={handleSaveProfile} onPhotoClick={() => setShowPhotoDialog(true)}
          handlePhotoDelete={handlePhotoDelete}
          profileErrors={profileErrors}
          profileGlobalError={profileGlobalError}
          isSavingProfile={isSavingProfile}
          clearProfileError={(field) => {
            setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
            if (profileGlobalError) setProfileGlobalError(null);
          }}
          businessData={businessData}
          onEditBusinessApplication={() => navigateTo("profile-settings-business")}
          navigateToBusinessTab={() => setActiveTabFromChild("business")}
        />
      );
      case "listings":
      case "mylistings": return (
        <MyAdsTab
          ads={myAds}
          adCounts={adCounts}
          loadingAds={loadingAds}
          myAdsTab={myAdsTab}
          setMyAdsTab={setMyAdsTab}
          navigateTo={(page: UserPage, adId?: string | number, category?: string, businessId?: string, serviceId?: string | number) => navigateTo(page, adId, category, businessId, serviceId)}
          getStatusBadge={getStatusBadge}
          fetchMyAds={fetchMyAds}
          formatDate={formatDate}
          handleDeleteAd={handleDeleteAdForTab}
          handleMarkAsSold={handleMarkAsSoldForTab}
        />
      );
      case "services": return (
        <MyServicesTab
          user={user}
          activeTab={activeTab}
          statusFilter={myServicesTab}
          navigateTo={(page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string | number) => navigateTo(page as UserPage, adId, category, businessId, serviceId)}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          isBusinessApproved={businessData?.status === "live"}
          onRegisterBusiness={() => setShowBusinessEditForm(true)}
        />
      );
      case "spareparts": return (
        <MySparePartsTab
          user={user}
          activeTab={activeTab}
          statusFilter="live"
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          isBusinessApproved={businessData?.status === "live"}
          onRegisterBusiness={() => setShowBusinessEditForm(true)}
        />
      );
      case "saved": return <SavedAds navigateTo={(page, adId) => navigateTo(page as UserPage, adId)} />;
      case "plans": return <PlansTab dynamicPlans={dynamicPlans} currentPlan={user?.plan || "Free"} setSelectedPlan={(id) => setSelectedPlan(id)} setShowPlanDialog={setShowPlanDialog} formatCurrency={formatPrice} />;
      case "business": return <BusinessTab businessData={businessData} businessStats={businessStats} isLoading={businessLoading} isFetched={businessFetched} showBusinessEditForm={showBusinessEditForm} setShowBusinessEditForm={setShowBusinessEditForm} user={user} onUpdateUser={onUpdateUser} navigateTo={(page, adId, category, sellerIdOrBusinessId) => navigateTo(page as UserPage, adId, category, sellerIdOrBusinessId)} setActiveTab={setActiveTabFromChild} />;
      case "settings": return <SettingsTab notifications={notifications} setNotifications={setNotifications} setShowDeleteDialog={setShowDeleteDialog} />;
      case "smartalerts": return (
        <SmartAlertsTab
          smartAlerts={smartAlertItems}
          savedSearches={savedSearches}
          newAlertName={newAlertName} setNewAlertName={setNewAlertName}
          newAlertKeywords={newAlertKeywords} setNewAlertKeywords={setNewAlertKeywords}
          newAlertCategory={newAlertCategory} setNewAlertCategory={setNewAlertCategory}
          newAlertLocation={newAlertLocation} setNewAlertLocation={setNewAlertLocation}
          newAlertRadius={newAlertRadius} setNewAlertRadius={setNewAlertRadius}
          createAlertEmail={createAlertEmail} setCreateAlertEmail={setCreateAlertEmail}
          alertPreferences={alertPreferences} setAlertPreferences={setAlertPreferences}
          handleCreateAlert={handleCreateAlert}
          handleDeleteAlert={(id) => {
            void toggleSmartAlertStatus(id);
          }}
          handleDeleteSavedSearch={(id) => {
            void deleteSavedSearch(id);
          }}
          handleViewAlertMatches={(alert) => {
            const params = new URLSearchParams();
            if (alert.keywords) params.set('q', alert.keywords);
            if (alert.category) params.set('category', alert.category);
            if (alert.locationId) params.set('locationId', alert.locationId);
            else if (alert.location) params.set('location', alert.location);
            if (alert.radius) params.set('radiusKm', String(alert.radius));
            window.location.assign(`/search?${params.toString()}`);
          }} handleEditAlert={() => notify.info("Coming soon!")}
          handleSavePreferences={handleSaveAlertPreferences}
          setActiveTab={setActiveTabFromChild} loading={loadingAlerts}
          createAlertErrors={createAlertErrors}
          createAlertGlobalError={createAlertGlobalError}
          preferencesGlobalError={alertPreferencesError}
          isSavingPreferences={isSavingAlertPreferences}
          clearCreateAlertError={(field) => {
            setCreateAlertErrors((prev) => ({ ...prev, [field]: undefined }));
            if (createAlertGlobalError) setCreateAlertGlobalError(null);
          }}
        />
      );
      case "purchases": return <PurchasesTab purchaseHistory={purchaseHistory} formatDate={formatDate} formatCurrency={formatPrice} setActiveTab={setActiveTabFromChild} loading={loadingPurchased} />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-3 pb-20 md:pb-10">
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
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuView(true)} className="h-8 w-8 rounded-full hover:bg-gray-200 -ml-1">
                <ChevronRight className="h-5 w-5 rotate-180 text-slate-700" />
              </Button>
              <h1 className="text-lg font-bold text-slate-900">
                {PROFILE_TAB_ITEMS.find(item => item.value === activeTab)?.label}
              </h1>
            </div>
          )}
        </div>

        {/* LAYOUT CONTAINER */}
        <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] md:gap-6">
          {/* LEFT SIDEBAR (Desktop Only) */}
          <aside className="hidden md:block space-y-1">
            <Card className="p-2 border-0 shadow-sm bg-white/80 backdrop-blur">
              {PROFILE_TAB_ITEMS.filter((item) => {
                if (!user) return false;
                const allowedRoles = ["user", "business", "admin", "super_admin", "moderator", "editor", "viewer", "user_manager", "finance_manager", "content_moderator", "custom"];
                if (!allowedRoles.includes(user.role)) return false;
                // Business-only tabs require a verified (live) business
                if (item.businessOnly) return businessData?.status === 'live';
                return true;
              }).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value} onClick={() => handleTabChange(item.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 font-medium group text-sm
                      ${isActive ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 ring-1 ring-blue-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <Icon className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
                  </button>
                );
              })}
              <Separator className="my-2" />
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors hover:bg-red-50 text-red-600 font-medium text-sm">
                <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
                <span>Logout</span>
              </button>
            </Card>

            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10"><Crown className="w-16 h-16" /></div>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Current Plan</p>
              <p className="text-lg font-bold flex items-center gap-2"><Crown className="h-4 w-4 text-amber-400 fill-amber-400" />{user?.plan || "Free"}</p>
              {(!user?.plan || user.plan === "Free") && (
                <Button onClick={() => setActiveTab("plans")} size="sm" className="w-full mt-3 bg-white/10 hover:bg-white/20 border-0 text-white text-xs h-8">Upgrade</Button>
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
                      {(!user?.plan || user.plan === "Free") && <Button onClick={() => handleMobileTabClick("plans")} size="sm" className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold px-4 h-8 rounded-full">Upgrade</Button>}
                    </div>
                  </div>
                  <Card className="p-2 border-0 shadow-sm">
                    {PROFILE_TAB_ITEMS.filter((item) => {
                      if (!user) return false;
                      const allowedRoles = ["user", "business", "admin", "super_admin", "moderator", "editor", "viewer", "user_manager", "finance_manager", "content_moderator", "custom"];
                      if (!allowedRoles.includes(user.role)) return false;
                      // Business-only tabs require a verified (live) business
                      if (item.businessOnly) return businessData?.status === 'live';
                      return true;
                    }).map((item) => (
                      <button key={item.value} onClick={() => handleMobileTabClick(item.value)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors active:bg-gray-100 text-slate-700 border-b border-gray-50 last:border-0">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><item.icon className="h-4.5 w-4.5" /></div>
                        <span className="text-sm font-semibold flex-1">{item.label}</span><ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                    <Separator className="my-1" />
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left active:bg-red-50 text-red-600">
                      <div className="p-2 bg-red-50 rounded-lg"><LogOut className="h-5 w-5" /></div><span className="text-sm font-semibold">Logout</span>
                    </button>
                  </Card>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  {user?.businessStatus && (
                    <BusinessStatusBanner 
                      status={user.businessStatus}
                      onAction={user.businessStatus === 'rejected'
                        ? () => navigateTo("business-register")
                        : () => handleTabChange("business")
                      }
                    />
                  )}
                  {renderContent()}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              {user?.businessStatus && (
                <BusinessStatusBanner 
                  status={user.businessStatus}
                  onAction={user.businessStatus === 'rejected'
                    ? () => navigateTo("business-register")
                    : () => handleTabChange("business")
                  }
                />
              )}
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Extracted Dialogs */}
      <DeleteAccountDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} deleteConfirmText={deleteConfirmText} setDeleteConfirmText={setDeleteConfirmText} onDelete={handleDeleteAccount} />
      <PlanPurchaseDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} selectedPlan={selectedPlan} plans={dynamicPlans} formatCurrency={formatPrice} onConfirm={() => setShowPlanDialog(false)} />
      <PhotoOptionsDialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog} onPhotoSelect={() => document.getElementById('photo-upload')?.click()} onPhotoDelete={handlePhotoDelete} />

      {/* Hidden File Input for Photo Upload */}
      <input type="file" id="photo-upload" name="profile-photo-upload" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
    </div>
  );

}

export default ProfileSettingsSidebar;
