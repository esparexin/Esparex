"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types/User";
import type {
  ProfileUser,
} from "@/components/user/profile/types";

// Hooks
import { useProfileIdentity } from "./profile/useProfileIdentity";
import { useProfileNotifications, normalizeMobileVisibility } from "./profile/useProfileNotifications";
import { useProfileTermination } from "./profile/useProfileTermination";
import { emptyProfileFieldErrors } from "./profile/validationMapper";

/* ---- Hook params ---- */
export interface UseProfileSettingsParams {
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
}

/* ---- Hook ---- */
export function useProfileSettings({
  user,
  onUpdateUser,
  onLogout,
}: UseProfileSettingsParams) {
  // ── Domain Hooks ───────────────────────────────────────────────────────────
  const {
    notifications, setNotifications,
    mobileVisibility, setMobileVisibility,
    notificationSettingsError, setNotificationSettingsError,
    isSavingNotificationSettings,
    handleSaveNotificationSettings,
  } = useProfileNotifications({ user, onUpdateUser });

  const {
    formData, setFormData,
    profilePhoto, setProfilePhoto,
    selectedPhotoFile, setSelectedPhotoFile,
    profileErrors, setProfileErrors,
    profileGlobalError, setProfileGlobalError,
    isSavingProfile,
    showPhotoDialog, setShowPhotoDialog,
    handleSaveProfile,
    handlePhotoSelect,
    handlePhotoDelete,
  } = useProfileIdentity({ user, onUpdateUser, notifications, mobileVisibility });

  const {
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    deleteReason, setDeleteReason,
    deleteFeedback, setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    handleDeleteAccount,
  } = useProfileTermination({ onLogout });

  // Smart alerts state moved back to useSmartAlerts entirely

  // ── Non-Domain UI State ─────────────────────────────────────────────────────
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // ── Propagation: Sync user prop changes to all hooks ────────────────────────
  useEffect(() => {
    if (!user) {
      setProfilePhoto(null);
      setSelectedPhotoFile(null);
      setNotificationSettingsError(null);
      setShowDeleteDialog(false);
      return;
    }
    const profileUser = user as ProfileUser;
    
    // Sync Identity
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.mobile || profileUser.phone || "",
      businessName: profileUser.businessName || "",
      gstNumber: profileUser.gstNumber || "",
    });
    setProfilePhoto(user.profilePhoto || null);
    setSelectedPhotoFile(null);
    setProfileErrors(emptyProfileFieldErrors());
    setProfileGlobalError(null);

    // Sync Notifications
    setNotificationSettingsError(null);
    if (profileUser.mobileVisibility) {
      setMobileVisibility(normalizeMobileVisibility(profileUser.mobileVisibility));
    }
    setNotifications({
      adUpdates: user.notificationSettings?.adUpdates ?? true,
      promotions: user.notificationSettings?.promotions ?? false,
      emailNotifications: user.notificationSettings?.emailNotifications ?? true,
      pushNotifications: user.notificationSettings?.pushNotifications ?? true,
      instantAlerts: user.notificationSettings?.instantAlerts ?? true,
    });
  }, [user, setProfilePhoto, setSelectedPhotoFile, setNotificationSettingsError, setShowDeleteDialog, setFormData, setProfileErrors, setProfileGlobalError, setMobileVisibility, setNotifications]);

  return {
    // Identity
    formData, setFormData,
    profilePhoto,
    selectedPhotoFile,
    profileErrors, setProfileErrors,
    profileGlobalError, setProfileGlobalError,
    isSavingProfile,
    handleSaveProfile,
    handlePhotoSelect,
    handlePhotoDelete,
    showPhotoDialog, setShowPhotoDialog,

    // Notifications & visibility
    notifications, setNotifications,
    mobileVisibility, setMobileVisibility,
    notificationSettingsError,
    isSavingNotificationSettings,
    handleSaveNotificationSettings,

    // Termination
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    deleteReason, setDeleteReason,
    deleteFeedback, setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    handleDeleteAccount,

    // UI Dialogs
    showPlanDialog, setShowPlanDialog,
    selectedPlan, setSelectedPlan,

    // Smart alerts logic moved to ProfileSettingsSidebar directly using useSmartAlerts
  };
}
