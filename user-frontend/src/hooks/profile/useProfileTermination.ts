"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { notify } from "@/lib/notify";
import logger from "@/lib/logger";
import { deleteAccountFormSchema } from "@/schemas/profileSettings.schema";
import type {
  DeleteAccountFieldErrors,
  DeleteAccountPayload,
  DeleteAccountReason,
} from "@/components/user/profile/types";
import { getErrorMessage } from "./validationMapper";

const emptyDeleteAccountFieldErrors = (): DeleteAccountFieldErrors => ({
  reason: undefined,
  feedback: undefined,
  confirmText: undefined,
});

interface UseProfileTerminationProps {
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
}

export function useProfileTermination({
  onLogout
}: UseProfileTerminationProps) {
  const [showDeleteDialogState, setShowDeleteDialogState] = useState(false);
  const [deleteConfirmText, setDeleteConfirmTextState] = useState("");
  const [deleteReason, setDeleteReasonState] = useState<DeleteAccountReason>("not_useful");
  const [deleteFeedback, setDeleteFeedbackState] = useState("");
  const [deleteAccountErrors, setDeleteAccountErrors] = useState<DeleteAccountFieldErrors>(
    emptyDeleteAccountFieldErrors
  );
  const [deleteAccountGlobalError, setDeleteAccountGlobalError] = useState<string | null>(null);

  const setShowDeleteDialog = useCallback((show: boolean) => {
    setShowDeleteDialogState(show);
    if (!show) {
      setDeleteConfirmTextState("");
      setDeleteReasonState("not_useful");
      setDeleteFeedbackState("");
    }
    setDeleteAccountErrors(emptyDeleteAccountFieldErrors());
    setDeleteAccountGlobalError(null);
  }, []);

  const setDeleteConfirmText = useCallback((text: string) => {
    setDeleteConfirmTextState(text);
    setDeleteAccountErrors((prev) => ({ ...prev, confirmText: undefined }));
    setDeleteAccountGlobalError(null);
  }, []);

  const setDeleteReason = useCallback((reason: DeleteAccountReason) => {
    setDeleteReasonState(reason);
    setDeleteAccountErrors((prev) => ({ ...prev, reason: undefined }));
    setDeleteAccountGlobalError(null);
  }, []);

  const setDeleteFeedback = useCallback((feedback: string) => {
    setDeleteFeedbackState(feedback);
    setDeleteAccountErrors((prev) => ({ ...prev, feedback: undefined }));
    setDeleteAccountGlobalError(null);
  }, []);

  const handleDeleteAccount = async () => {
    const parsedDeleteAccount = deleteAccountFormSchema.safeParse({
      reason: deleteReason,
      feedback: deleteFeedback,
      confirmText: deleteConfirmText,
    });

    if (!parsedDeleteAccount.success) {
      const nextErrors = emptyDeleteAccountFieldErrors();
      let nextGlobalError: string | null = null;

      for (const issue of parsedDeleteAccount.error.issues) {
        const field = issue.path[0];
        if (field === "reason") nextErrors.reason = issue.message;
        else if (field === "feedback") nextErrors.feedback = issue.message;
        else if (field === "confirmText") nextErrors.confirmText = issue.message;
        else if (!nextGlobalError) nextGlobalError = issue.message;
      }

      setDeleteAccountErrors(nextErrors);
      setDeleteAccountGlobalError(nextGlobalError || "Please correct the highlighted fields.");
      return;
    }

    const payload: DeleteAccountPayload = {
      reason: parsedDeleteAccount.data.reason,
      feedback: parsedDeleteAccount.data.feedback,
    };

    setDeleteAccountErrors(emptyDeleteAccountFieldErrors());
    setDeleteAccountGlobalError(null);

    try {
      await apiClient.delete(API_ROUTES.USER.USERS_ME, {
        data: payload,
        silent: true,
      });
      notify.success("Account deleted successfully");
      localStorage.removeItem("esparex_user_session");
      setShowDeleteDialog(false);
      await onLogout({ skipServerLogout: true });
    } catch (err) {
      logger.error("Delete account failed", err);
      setDeleteAccountGlobalError(getErrorMessage(err, "Failed to delete account"));
    }
  };

  return {
    showDeleteDialog: showDeleteDialogState,
    setShowDeleteDialog,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteReason,
    setDeleteReason,
    deleteFeedback,
    setDeleteFeedback,
    deleteAccountErrors,
    setDeleteAccountErrors,
    deleteAccountGlobalError,
    setDeleteAccountGlobalError,
    handleDeleteAccount,
  };
}
