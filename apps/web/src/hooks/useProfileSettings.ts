"use client";

import { useEffect } from "react";

import type {
  ProfileUser,
} from "@/components/user/profile/types";

// Hooks
import { useProfileTermination } from "./profile/useProfileTermination";

/* ---- Hook params ---- */
export interface UseProfileSettingsParams {
  user: ProfileUser | null;
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
}

/* ---- Hook ---- */
export function useProfileSettings({
  user,
  onLogout,
}: UseProfileSettingsParams) {
  // ── Domain Hooks ───────────────────────────────────────────────────────────
  const {
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    deleteReason, setDeleteReason,
    deleteFeedback, setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    isDeleting,
    handleDeleteAccount,
  } = useProfileTermination({ onLogout });


  // ── Propagation: Sync user prop changes to all hooks ────────────────────────
  useEffect(() => {
    if (!user) {
      setShowDeleteDialog(false);
      return;
    }
  }, [user, setShowDeleteDialog]);

  return {
    // Termination
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    deleteReason, setDeleteReason,
    deleteFeedback, setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    isDeleting,
    handleDeleteAccount,

    // Smart alerts logic moved to ProfileSettingsSidebar directly using useSmartAlerts
  };
}
