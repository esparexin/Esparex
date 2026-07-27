"use client";

import { useState, useEffect } from "react";

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
    handleDeleteAccount,
  } = useProfileTermination({ onLogout });

  // Smart alerts state moved back to useSmartAlerts entirely

  // ── Non-Domain UI State ─────────────────────────────────────────────────────
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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
    handleDeleteAccount,

    // UI Dialogs
    showPlanDialog, setShowPlanDialog,
    selectedPlan, setSelectedPlan,

    // Smart alerts logic moved to ProfileSettingsSidebar directly using useSmartAlerts
  };
}
