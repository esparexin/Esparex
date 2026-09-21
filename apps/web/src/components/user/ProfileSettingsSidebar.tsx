"use client";

import type { User } from "@esparex/contracts";
import type { ProfileUser } from "@/components/user/profile/types";
import { Button, UnsavedChangesDialog } from "@esparex/ui";
import type { UserPage } from "@/lib/routeUtils";
import type { ListingStatsResponse } from "@/lib/api/user/listings";
import type { ConversationListView } from "@/lib/api/chatApi";
import type { IConversationDTO } from "@esparex/contracts";

import { DeleteAccountDialog } from "./profile/dialogs/DeleteAccountDialog";
import { MobileAccountBottomNav } from "./MobileAccountBottomNav";
import { AccountDesktopSidebar } from "./profile/AccountDesktopSidebar";
import { ProfileTabContentRouter } from "./profile/ProfileTabContentRouter";
import { AccountHeader } from "./AccountHeader";
import { BusinessStatusBanner } from "@/components/business/BusinessStatusBanner";
import type { ProfileTabValue } from "@/config/navigation";
import { useProfileSidebarState } from "./profile/useProfileSidebarState";

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
  const {
    activeTab,
    isViewingActiveChat,
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
    plansState,
    businessState,
    smartAlertsState,
    deleteAccountState,
  } = useProfileSidebarState({
    user,
    initialTab,
    initialConversationId,
    onLogout,
    navigateTo,
  });

  const renderTabBadge = (value: ProfileTabValue) => {
    if (value !== "messages" || chatUnreadCount <= 0) return null;
    return (
      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-tiny font-bold text-primary-foreground">
        {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
      </span>
    );
  };

  const isBannerContextual = activeTab === "personal";
  const businessStatusBanner = isBannerContextual && user?.businessStatus && !isBusinessLive ? (
    <BusinessStatusBanner
      status={user.businessStatus}
      onAction={user.businessStatus === "rejected" ? () => navigateTo("business-register") : () => handleTabChange("business")}
    />
  ) : null;

  return (
    <div className={`bg-background ${isViewingActiveChat ? "pb-0 overflow-hidden h-[calc(100dvh-6.25rem)]" : "pb-[calc(4rem+env(safe-area-inset-bottom))]"} md:pb-0 md:h-auto md:overflow-visible`}>
      {/* UNIFIED RESPONSIVE ACCOUNT HEADER (Single Instance) */}
      {!isViewingActiveChat && (
        <AccountHeader
          activeTab={activeTab}
          onBackToMenu={() => handleTabChange("more")}
          rightElement={
            activeTab === "mylistings" ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigateTo("post-ad")}
                className="text-caption h-8 px-3 font-semibold rounded-lg shadow-xs"
              >
                + Post Ad
              </Button>
            ) : activeTab === "plans" ? (
              <div className="text-tiny font-medium text-muted-foreground bg-muted/60 border border-border/80 px-2.5 py-1 rounded-full shrink-0">
                Current: <span className="font-bold text-foreground">{user?.plan || "Free"}</span>
              </div>
            ) : undefined
          }
        />
      )}

      <div className={`w-full max-w-7xl mx-auto ${isViewingActiveChat || activeTab === "more" ? "p-0" : "px-4 sm:px-6 lg:px-8 pt-1"} ${isViewingActiveChat ? "h-full flex flex-col" : ""} md:py-6 md:h-auto`}>
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
            <ProfileTabContentRouter
              activeTab={activeTab}
              user={user}
              onTabChange={handleTabChange}
              onLogout={onLogout}
              renderTabBadge={renderTabBadge}
              onUpdateUser={onUpdateUser}
              setIsPersonalTabDirty={setIsPersonalTabDirty}
              adCounts={adCounts as ListingStatsResponse}
              navigateTo={navigateTo}
              normalizedBusinessStatus={normalizedBusinessStatus}
              initialListingSubTab={initialListingSubTab}
              initialConversationId={initialConversationId}
              initialMessagesView={initialMessagesView}
              initialConversation={initialConversation}
              plansState={plansState}
              businessState={businessState}
              setShowDeleteDialog={deleteAccountState.setShowDeleteDialog}
              smartAlertsState={smartAlertsState}
            />
          </section>
        </div>
      </div>

      {!isViewingActiveChat && (
        <MobileAccountBottomNav activeTab={activeTab} onTabChange={handleTabChange} unreadCount={chatUnreadCount} />
      )}

      {/* Extracted Dialogs */}
      <DeleteAccountDialog
        open={deleteAccountState.showDeleteDialog}
        onOpenChange={deleteAccountState.setShowDeleteDialog}
        deleteConfirmText={deleteAccountState.deleteConfirmText}
        setDeleteConfirmText={deleteAccountState.setDeleteConfirmText}
        deleteReason={deleteAccountState.deleteReason}
        setDeleteReason={deleteAccountState.setDeleteReason}
        deleteFeedback={deleteAccountState.deleteFeedback}
        setDeleteFeedback={deleteAccountState.setDeleteFeedback}
        onDelete={deleteAccountState.handleDeleteAccount}
        isDeleting={deleteAccountState.isDeleting}
        deleteAccountErrors={deleteAccountState.deleteAccountErrors}
        deleteAccountGlobalError={deleteAccountState.deleteAccountGlobalError}
      />

      {/* Unsaved Profile Changes Modal */}
      <UnsavedChangesDialog
        open={showUnsavedModal}
        onOpenChange={setShowUnsavedModal}
        onConfirm={handleConfirmDiscard}
        description="You have unsaved profile changes. If you leave now, your changes will be lost."
      />
    </div>
  );
}
