"use client";

import type { User } from "@esparex/contracts";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";
import type { ProfileUser } from "@/components/user/profile/types";
import type { UserPage } from "@/lib/routeUtils";
import type { ListingStatsResponse } from "@/lib/api/user/listings";
import type { ConversationListView } from "@/lib/api/chatApi";
import type { IConversationDTO } from "@esparex/contracts";

import { MoreMenuTab } from "./tabs/MoreMenuTab";
import { PersonalTab } from "./tabs/PersonalTab";
import { PlansTab } from "./tabs/PlansTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { SmartAlertsTab } from "./tabs/SmartAlertsTab";
import { BusinessTab } from "./tabs/BusinessTab";
import { MyListingsTab } from "./tabs/MyListingsTab";
import { SavedAdsTab } from "./tabs/SavedAdsTab";
import { AccountMessagesWorkspace } from "@/components/chat/AccountMessagesWorkspace";
import { getStatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/formatters";

import type { useBusiness } from "@/hooks/useBusiness";
import type { useSmartAlerts } from "@/hooks/useSmartAlerts";

export interface ProfileTabContentRouterProps {
  activeTab: ProfileTabValue;
  user: ProfileUser | null;
  onTabChange: (tab: ProfileTabValue) => void;
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
  renderTabBadge: (tabKey: ProfileTabValue) => React.ReactNode;
  onUpdateUser: (userData: User) => void;
  setIsPersonalTabDirty: (isDirty: boolean) => void;
  adCounts: ListingStatsResponse | null | undefined;
  navigateTo: (page: UserPage, adId?: string | number, category?: string, businessId?: string, serviceId?: string | number) => void;
  normalizedBusinessStatus: Parameters<typeof MyListingsTab>[0]["businessStatus"];
  initialListingSubTab?: "ads" | "services" | "spare-parts";
  initialConversationId?: string;
  initialMessagesView?: ConversationListView;
  initialConversation?: IConversationDTO | null;
  plansState: {
    dynamicPlans: unknown[];
    isError: boolean;
  };
  businessState: ReturnType<typeof useBusiness>;
  setShowDeleteDialog: (show: boolean) => void;
  smartAlertsState: ReturnType<typeof useSmartAlerts>;
}

export function ProfileTabContentRouter({
  activeTab,
  user,
  onTabChange,
  onLogout,
  renderTabBadge,
  onUpdateUser,
  setIsPersonalTabDirty,
  adCounts,
  navigateTo,
  normalizedBusinessStatus,
  initialListingSubTab,
  initialConversationId,
  initialMessagesView,
  initialConversation,
  plansState,
  businessState,
  setShowDeleteDialog,
  smartAlertsState,
}: ProfileTabContentRouterProps) {
  const setActiveTabFromChild = (tab: string) => {
    if (PROFILE_TAB_ITEMS.some((item) => item.value === tab)) {
      onTabChange(tab as ProfileTabValue);
    }
  };

  switch (activeTab) {
    case "more":
      return <MoreMenuTab user={user} onTabChange={onTabChange} onLogout={onLogout} renderTabBadge={renderTabBadge} />;
    case "personal":
      return <PersonalTab user={user} onUpdateUser={onUpdateUser} onDirtyChange={setIsPersonalTabDirty} />;
    case "mylistings":
      return (
        <MyListingsTab
          adCounts={adCounts as ListingStatsResponse}
          user={user}
          navigateTo={(page, adId, category, businessId, serviceId) =>
            navigateTo(page as UserPage, adId, category, businessId as string, serviceId as string)
          }
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          businessStatus={normalizedBusinessStatus}
          onRegisterBusiness={() => navigateTo("business-register")}
          initialSubTab={initialListingSubTab}
        />
      );
    case "messages":
      return (
        <AccountMessagesWorkspace
          currentUserId={user?.id ?? ""}
          conversationId={initialConversationId}
          initialView={initialMessagesView}
          initialConversation={initialConversation}
        />
      );
    case "saved":
      return <SavedAdsTab navigateTo={(page) => navigateTo(page as UserPage)} />;
    case "plans":
      return (
        <PlansTab
          dynamicPlans={plansState.dynamicPlans as Parameters<typeof PlansTab>[0]["dynamicPlans"]}
          currentPlan={user?.plan || "Free"}
          initialTab="OVERVIEW"
        />
      );
    case "buyplans":
      return (
        <PlansTab
          dynamicPlans={plansState.dynamicPlans as Parameters<typeof PlansTab>[0]["dynamicPlans"]}
          currentPlan={user?.plan || "Free"}
          initialTab="BUY_PLANS"
        />
      );
    case "business":
      return (
        <BusinessTab
          businessData={businessState.businessData as Parameters<typeof BusinessTab>[0]["businessData"]}
          businessStats={businessState.businessStats as Parameters<typeof BusinessTab>[0]["businessStats"]}
          isLoading={businessState.isLoading}
          isFetched={businessState.isFetched}
          navigateTo={navigateTo}
          onDeactivate={businessState.deactivate}
          onReactivate={businessState.reactivate}
          onClose={businessState.close}
          onRenew={businessState.renew}
        />
      );
    case "settings":
      return <SettingsTab user={user} onUpdateUser={onUpdateUser} setShowDeleteDialog={setShowDeleteDialog} />;
    case "smartalerts":
      return (
        <SmartAlertsTab
          smartAlerts={smartAlertsState.smartAlertItems as Parameters<typeof SmartAlertsTab>[0]["smartAlerts"]}
          savedSearches={smartAlertsState.savedSearches as Parameters<typeof SmartAlertsTab>[0]["savedSearches"]}
          userPlan={user?.plan || "Free"}
          smartAlertForm={smartAlertsState.smartAlertForm as Parameters<typeof SmartAlertsTab>[0]["smartAlertForm"]}
          updateSmartAlertForm={smartAlertsState.updateSmartAlertForm as Parameters<typeof SmartAlertsTab>[0]["updateSmartAlertForm"]}
          handleCreateAlert={smartAlertsState.handleCreateAlert}
          handleToggleAlertStatus={(id) => { void smartAlertsState.toggleSmartAlertStatus(id); }}
          handleDeleteAlert={(id) => { void smartAlertsState.deleteSmartAlert(id); }}
          handleDeleteSavedSearch={(id) => { void smartAlertsState.deleteSavedSearch(id); }}
          handleEditAlert={(alert) => smartAlertsState.handleEditAlert(alert)}
          editingAlertId={smartAlertsState.editingAlertId}
          resetAlertForm={smartAlertsState.resetAlertForm}
          setActiveTab={setActiveTabFromChild}
          loading={smartAlertsState.loading}
          smartAlertErrors={smartAlertsState.smartAlertErrors}
          smartAlertGlobalError={smartAlertsState.smartAlertGlobalError}
          clearSmartAlertError={smartAlertsState.clearSmartAlertError}
          quota={smartAlertsState.quota as Parameters<typeof SmartAlertsTab>[0]["quota"]}
        />
      );
    case "purchases":
      return (
        <PlansTab
          dynamicPlans={plansState.dynamicPlans as Parameters<typeof PlansTab>[0]["dynamicPlans"]}
          currentPlan={user?.plan || "Free"}
          initialTab="INVOICES"
        />
      );
    default:
      return null;
  }
}
