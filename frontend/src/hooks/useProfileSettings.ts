"use client";

import { useState, useEffect } from "react";
import { notify } from "@/lib/notify";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { User } from "@/types/User";
import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import {
  describeWebPushStatus,
  isBrowserPushConfigured,
  isBrowserPushSupported,
  syncBrowserPushRegistration,
} from "@/lib/notifications/webPush";
import { updateProfile } from "@/lib/api/user/users";
import {
  isAllowedProfilePhotoType,
  PROFILE_PHOTO_ALLOWED_LABEL,
  PROFILE_PHOTO_MAX_BYTES,
} from "@/lib/uploads/profilePhotoUpload";
import {
  deleteAccountFormSchema,
  profileFormSchema,
} from "@/schemas/profileSettings.schema";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";
import {
  SmartAlertCreateSchema,
  SmartAlertUpdateSchema,
} from "@shared/schemas/smartAlert.schema";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";
import type { Location as AppLocation } from "@/lib/api/user/locations";
import { sanitizeMongoObjectId } from "@shared/listingUtils/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import {
  MOBILE_VISIBILITY,
  normalizeMobileVisibility as normalizeSharedMobileVisibility,
} from "@shared/constants/mobileVisibility";
import type {
  DeleteAccountFieldErrors,
  DeleteAccountPayload,
  DeleteAccountReason,
  MobileVisibility,
  NotificationPreferences,
  SmartAlertFieldErrors,
  SmartAlertFormData,
  ProfileFieldErrors,
  ProfileFormData,
  ProfileUser,
  SmartAlertItem,
} from "@/components/user/profile/types";

export type { ProfileUser };

type SmartAlertLocationSelection = Pick<
  AppLocation,
  "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

/* ---- Module-level helpers ---- */
export const normalizeMobileVisibility = (value: unknown): MobileVisibility => {
  const normalized = normalizeSharedMobileVisibility(value, MOBILE_VISIBILITY.SHOW);
  return normalized === MOBILE_VISIBILITY.ON_REQUEST
    ? MOBILE_VISIBILITY.SHOW
    : normalized;
};

const getErrorMessage = (rawError: unknown, fallback: string): string =>
  mapErrorToMessage(rawError, fallback);

const getErrorPayload = (rawError: unknown): Record<string, unknown> | null => {
  const responseData = (rawError as { response?: { data?: unknown } })?.response?.data;
  if (!responseData || typeof responseData !== "object") return null;
  const topLevel = responseData as Record<string, unknown>;
  if (topLevel.data && typeof topLevel.data === "object") return topLevel.data as Record<string, unknown>;
  return topLevel;
};

const normalizeFieldName = (value: unknown): string => {
  if (typeof value === "string") return value.split(".").pop()?.trim() || "";
  if (Array.isArray(value)) {
    const last = value[value.length - 1];
    return typeof last === "string" ? last.trim() : "";
  }
  return "";
};

const mapProfileValidationError = (
  rawError: unknown
): { fieldErrors: ProfileFieldErrors; globalError?: string } | null => {
  const payload = getErrorPayload(rawError);
  if (!payload) return null;

  const fieldErrors: ProfileFieldErrors = {};
  let globalError: string | undefined;

  const pushFieldError = (fieldName: string, message: string) => {
    if (["name", "email", "businessName", "gstNumber", "photo"].includes(fieldName)) {
      (fieldErrors as Record<string, string>)[fieldName] = message;
      return true;
    }
    if (fieldName === "profilePhoto" || fieldName === "avatar") {
      fieldErrors.photo = message;
      return true;
    }
    return false;
  };

  const details = Array.isArray(payload.details) ? payload.details : Array.isArray(payload.errors) ? payload.errors : null;
  if (details) {
    for (const detail of details) {
      if (!detail || typeof detail !== "object") continue;
      const record = detail as { field?: unknown; path?: unknown; message?: unknown; msg?: unknown };
      const fieldName = normalizeFieldName(record.field ?? record.path);
      const message = typeof record.message === "string" ? record.message : typeof record.msg === "string" ? record.msg : undefined;
      if (!message) continue;
      if (!pushFieldError(fieldName, message) && !globalError) globalError = message;
    }
  }

  if (payload.fieldErrors && typeof payload.fieldErrors === "object") {
    const map = payload.fieldErrors as Record<string, unknown>;
    for (const [fieldKey, messageValue] of Object.entries(map)) {
      if (typeof messageValue !== "string") continue;
      const fieldName = normalizeFieldName(fieldKey);
      if (!pushFieldError(fieldName, messageValue) && !globalError) globalError = messageValue;
    }
  }

  if (!globalError) {
    const fallbackError = payload.error;
    const fallbackMessage = payload.message;
    if (typeof fallbackError === "string") globalError = fallbackError;
    else if (typeof fallbackMessage === "string") globalError = fallbackMessage;
  }

  if (!Object.values(fieldErrors).some(Boolean) && !globalError) return null;
  return { fieldErrors, globalError };
};

const emptyProfileFieldErrors = (): ProfileFieldErrors => ({
  name: undefined,
  email: undefined,
  businessName: undefined,
  gstNumber: undefined,
  photo: undefined,
});

const emptyDeleteAccountFieldErrors = (): DeleteAccountFieldErrors => ({
  reason: undefined,
  feedback: undefined,
  confirmText: undefined,
});

const createInitialSmartAlertForm = (): SmartAlertFormData => ({
  name: "",
  keywords: "",
  category: "",
  location: "",
  locationId: null,
  radius: 50,
  emailNotifications: true,
});

const emptySmartAlertFieldErrors = (): SmartAlertFieldErrors => ({
  name: undefined,
  keywords: undefined,
  category: undefined,
  location: undefined,
  radius: undefined,
});

/* ---- Hook params ---- */
export interface UseProfileSettingsParams {
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
  onLogout: (options?: { skipServerLogout?: boolean }) => void | Promise<void>;
  createSmartAlert: (data: SmartAlertCreatePayload) => Promise<unknown>;
  updateSmartAlert: (id: string, data: Partial<SmartAlertCreatePayload>) => Promise<unknown>;
}

/* ---- Hook ---- */
export function useProfileSettings({
  user,
  onUpdateUser,
  onLogout,
  createSmartAlert,
  updateSmartAlert,
}: UseProfileSettingsParams) {
  /* Profile form */
  const [formData, setFormData] = useState<ProfileFormData>(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.mobile || (user as ProfileUser | null)?.phone || "",
    businessName: (user as ProfileUser | null)?.businessName || "",
    gstNumber: (user as ProfileUser | null)?.gstNumber || "",
  }));
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => user?.profilePhoto || null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
  const [profileGlobalError, setProfileGlobalError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  /* Notification preferences */
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => ({
    adUpdates: user?.notificationSettings?.adUpdates ?? true,
    promotions: user?.notificationSettings?.promotions ?? false,
    emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
    pushNotifications: user?.notificationSettings?.pushNotifications ?? true,
    instantAlerts: user?.notificationSettings?.instantAlerts ?? true,
  }));

  /* Mobile visibility */
  const [mobileVisibility, setMobileVisibility] = useState<MobileVisibility>(() =>
    normalizeMobileVisibility(user?.mobileVisibility)
  );

  /* Dialog / visibility states */
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showDeleteDialogState, setShowDeleteDialogState] = useState(false);
  const [deleteConfirmText, setDeleteConfirmTextState] = useState("");
  const [deleteReason, setDeleteReasonState] = useState<DeleteAccountReason>("not_useful");
  const [deleteFeedback, setDeleteFeedbackState] = useState("");
  const [deleteAccountErrors, setDeleteAccountErrors] = useState<DeleteAccountFieldErrors>(
    emptyDeleteAccountFieldErrors
  );
  const [deleteAccountGlobalError, setDeleteAccountGlobalError] = useState<string | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  /* Smart alert form states */
  const [smartAlertForm, setSmartAlertForm] = useState<SmartAlertFormData>(createInitialSmartAlertForm);
  const [smartAlertErrors, setSmartAlertErrors] = useState<SmartAlertFieldErrors>(
    emptySmartAlertFieldErrors
  );
  const [smartAlertGlobalError, setSmartAlertGlobalError] = useState<string | null>(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [notificationSettingsError, setNotificationSettingsError] = useState<string | null>(null);
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] = useState(false);

  /* Sync from user prop */
  useEffect(() => {
    if (!user) {
      setProfilePhoto(null);
      setSelectedPhotoFile(null);
      setNotificationSettingsError(null);
      setDeleteReasonState("not_useful");
      setDeleteFeedbackState("");
      setDeleteConfirmTextState("");
      setDeleteAccountErrors(emptyDeleteAccountFieldErrors());
      setDeleteAccountGlobalError(null);
      return;
    }
    const profileUser = user as ProfileUser;
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.mobile || profileUser.phone || "",
      businessName: profileUser.businessName || "",
      gstNumber: profileUser.gstNumber || "",
    });
    setProfilePhoto(user.profilePhoto || null);
    setSelectedPhotoFile(null);
    setNotificationSettingsError(null);
    setDeleteReasonState("not_useful");
    setDeleteFeedbackState("");
    setDeleteConfirmTextState("");
    setDeleteAccountErrors(emptyDeleteAccountFieldErrors());
    setDeleteAccountGlobalError(null);
    if (profileUser.mobileVisibility) setMobileVisibility(normalizeMobileVisibility(profileUser.mobileVisibility));
    setNotifications({
      adUpdates: user.notificationSettings?.adUpdates ?? true,
      promotions: user.notificationSettings?.promotions ?? false,
      emailNotifications: user.notificationSettings?.emailNotifications ?? true,
      pushNotifications: user.notificationSettings?.pushNotifications ?? true,
      instantAlerts: user.notificationSettings?.instantAlerts ?? true,
    });
  }, [user]);

  /* ------ Handlers ------ */

  const setShowDeleteDialog = (show: boolean) => {
    setShowDeleteDialogState(show);
    if (!show) {
      setDeleteConfirmTextState("");
      setDeleteReasonState("not_useful");
      setDeleteFeedbackState("");
    }
    setDeleteAccountErrors(emptyDeleteAccountFieldErrors());
    setDeleteAccountGlobalError(null);
  };

  const setDeleteConfirmText = (text: string) => {
    setDeleteConfirmTextState(text);
    setDeleteAccountErrors((prev) => ({ ...prev, confirmText: undefined }));
    setDeleteAccountGlobalError(null);
  };

  const setDeleteReason = (reason: DeleteAccountReason) => {
    setDeleteReasonState(reason);
    setDeleteAccountErrors((prev) => ({ ...prev, reason: undefined }));
    setDeleteAccountGlobalError(null);
  };

  const setDeleteFeedback = (feedback: string) => {
    setDeleteFeedbackState(feedback);
    setDeleteAccountErrors((prev) => ({ ...prev, feedback: undefined }));
    setDeleteAccountGlobalError(null);
  };

  const updateSmartAlertForm = (updates: Partial<SmartAlertFormData>) => {
    setSmartAlertForm((prev) => ({ ...prev, ...updates }));
    const clearedErrors: Partial<SmartAlertFieldErrors> = {};
    for (const key of Object.keys(updates)) {
      if (key in emptySmartAlertFieldErrors()) {
        (clearedErrors as Record<string, string | undefined>)[key] = undefined;
      }
    }
    setSmartAlertErrors((prev) => ({ ...prev, ...clearedErrors }));
    setSmartAlertGlobalError(null);
  };

  const clearSmartAlertError = (field: keyof SmartAlertFieldErrors) => {
    setSmartAlertErrors((prev) => ({ ...prev, [field]: undefined }));
    setSmartAlertGlobalError(null);
  };

  const handleSaveProfile = async () => {
    const parsedProfile = profileFormSchema.safeParse({
      name: formData.name,
      email: formData.email,
      businessName: formData.businessName,
      gstNumber: formData.gstNumber,
      mobileVisibility,
    });

    if (!parsedProfile.success) {
      const nextErrors = emptyProfileFieldErrors();
      let nextGlobalError: string | null = null;

      for (const issue of parsedProfile.error.issues) {
        const field = issue.path[0];
        if (field === "name") nextErrors.name = issue.message;
        else if (field === "email") nextErrors.email = issue.message;
        else if (field === "businessName") nextErrors.businessName = issue.message;
        else if (field === "gstNumber") nextErrors.gstNumber = issue.message;
        else if (!nextGlobalError) nextGlobalError = issue.message;
      }

      setProfileErrors(nextErrors);
      setProfileGlobalError(nextGlobalError || "Please correct the highlighted fields.");
      return;
    }

    const {
      name: trimmedName,
      email: trimmedEmail,
      businessName,
      gstNumber,
      mobileVisibility: nextMobileVisibility,
    } = parsedProfile.data;

    setProfileErrors(emptyProfileFieldErrors());
    setProfileGlobalError(null);
    setIsSavingProfile(true);

    const submitData = new FormData();
    submitData.append("name", trimmedName);
    if (trimmedEmail) submitData.append("email", trimmedEmail);
    if (businessName) submitData.append("businessName", businessName);
    if (gstNumber) submitData.append("gstNumber", gstNumber);
    submitData.append("mobileVisibility", nextMobileVisibility);
    submitData.append("notificationSettings", JSON.stringify(notifications));
    if (selectedPhotoFile) submitData.append("profilePhoto", selectedPhotoFile);

    try {
      const updatedUser = await updateProfile(submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        silent: true,
      });
      if (!updatedUser) { setProfileGlobalError("Failed to update profile."); return; }
      onUpdateUser(updatedUser);
      setProfilePhoto(updatedUser.profilePhoto || null);
      setSelectedPhotoFile(null);
      setProfileErrors(emptyProfileFieldErrors());
      notify.success("Profile updated successfully!");
    } catch (err) {
      const mappedValidation = mapProfileValidationError(err);
      if (mappedValidation) {
        const hasFieldErrors = Object.values(mappedValidation.fieldErrors).some(Boolean);
        setProfileErrors((prev) => ({
          ...prev,
          ...emptyProfileFieldErrors(),
          ...mappedValidation.fieldErrors,
        }));
        setProfileGlobalError(
          mappedValidation.globalError ||
          (hasFieldErrors ? "Please correct the highlighted fields." : getErrorMessage(err, "Validation failed."))
        );
        return;
      }
      setProfileGlobalError(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setIsSavingProfile(false);
    }
  };

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedProfilePhotoType(file.type)) {
      setProfileErrors((prev) => ({
        ...prev,
        photo: `Unsupported image format. Use ${PROFILE_PHOTO_ALLOWED_LABEL}.`,
      }));
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setProfileErrors((prev) => ({ ...prev, photo: "Image size must be less than 5MB." }));
      return;
    }
    setSelectedPhotoFile(file);
    setProfileErrors((prev) => ({ ...prev, photo: undefined }));
    setProfileGlobalError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
      setShowPhotoDialog(false);
      notify.success("Photo selected! Click 'Save Changes' to upload.");
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDelete = () => {
    setProfilePhoto(null);
    setSelectedPhotoFile(null);
    setProfileErrors((prev) => ({ ...prev, photo: undefined }));
    setProfileGlobalError(null);
    setShowPhotoDialog(false);
    notify.success("Photo removed! Click 'Save Changes' to apply.");
  };

  const resetAlertForm = () => {
    setSmartAlertForm(createInitialSmartAlertForm());
    setSmartAlertErrors(emptySmartAlertFieldErrors());
    setSmartAlertGlobalError(null);
    setEditingAlertId(null);
  };

  const handleEditAlert = (alert: SmartAlertItem) => {
    setEditingAlertId(alert.id);
    setSmartAlertForm({
      name: alert.name,
      keywords: alert.keywords,
      category: alert.category,
      location: alert.location,
      locationId: alert.locationId || null,
      radius: alert.radius ?? 50,
      emailNotifications: alert.notificationChannels?.includes("email") ?? true,
    });
    setSmartAlertErrors(emptySmartAlertFieldErrors());
    setSmartAlertGlobalError(null);
  };

  const handleCreateAlert = async (
    selectedLocation: SmartAlertLocationSelection | null = null
  ): Promise<void> => {
    const parsedForm = smartAlertFormSchema.safeParse(smartAlertForm);
    if (!parsedForm.success) {
      const nextErrors = emptySmartAlertFieldErrors();
      let nextGlobalError: string | null = null;

      for (const issue of parsedForm.error.issues) {
        const field = issue.path[0];
        if (field === "name") nextErrors.name = issue.message;
        else if (field === "keywords") nextErrors.keywords = issue.message;
        else if (field === "category") nextErrors.category = issue.message;
        else if (field === "location") nextErrors.location = issue.message;
        else if (field === "radius") nextErrors.radius = issue.message;
        else if (!nextGlobalError) nextGlobalError = issue.message;
      }

      setSmartAlertErrors(nextErrors);
      setSmartAlertGlobalError(nextGlobalError || "Please correct the highlighted fields.");
      return;
    }

    const {
      name,
      keywords,
      category,
      location,
      locationId,
      radius,
      emailNotifications,
    } = parsedForm.data;

    const canonicalCoordinates = toCanonicalGeoPoint(selectedLocation?.coordinates);
    const canonicalLocationId = sanitizeMongoObjectId(
      selectedLocation?.locationId || selectedLocation?.id || locationId
    );
    const locationDisplay =
      selectedLocation?.display ||
      selectedLocation?.name ||
      selectedLocation?.city ||
      location ||
      "";

    setSmartAlertErrors(emptySmartAlertFieldErrors());
    setSmartAlertGlobalError(null);

    const basePayload = {
      name,
      criteria: {
        keywords,
        category: category || undefined,
        location: locationDisplay || undefined,
        locationId: canonicalLocationId || undefined,
      },
      ...(canonicalCoordinates ? { coordinates: canonicalCoordinates } : {}),
      radiusKm: radius,
      frequency: "instant" as const,
      notificationChannels: emailNotifications ? ["email"] : ["push"],
    };

    if (!editingAlertId && (!canonicalCoordinates || !canonicalLocationId || !locationDisplay)) {
      setSmartAlertErrors((prev) => ({
        ...prev,
        location: "Please select a valid location from the location search.",
      }));
      return;
    }

    const parsedPayload = editingAlertId
      ? SmartAlertUpdateSchema.safeParse(basePayload)
      : SmartAlertCreateSchema.safeParse(basePayload);

    if (!parsedPayload.success) {
      const nextErrors = emptySmartAlertFieldErrors();
      let nextGlobalError: string | null = null;

      for (const issue of parsedPayload.error.issues) {
        const [root, nested] = issue.path;
        if (root === "name") nextErrors.name = issue.message;
        else if (root === "criteria" && nested === "keywords") nextErrors.keywords = issue.message;
        else if (root === "criteria" && nested === "category") nextErrors.category = issue.message;
        else if (root === "criteria" && (nested === "location" || nested === "locationId")) nextErrors.location = issue.message;
        else if (root === "radiusKm") nextErrors.radius = issue.message;
        else if (!nextGlobalError) nextGlobalError = issue.message;
      }

      setSmartAlertErrors(nextErrors);
      setSmartAlertGlobalError(nextGlobalError || "Please check alert details and try again.");
      return;
    }

    const requestPayload = parsedPayload.data as SmartAlertCreatePayload;
    const result = editingAlertId
      ? await updateSmartAlert(editingAlertId, requestPayload)
      : await createSmartAlert(requestPayload);

    if (typeof result === "object" && result !== null && "success" in result && (result as any).success) {
      resetAlertForm();
      notify.success(editingAlertId ? "Alert updated successfully." : "Alert created successfully.");
    } else {
      setSmartAlertGlobalError((result as any).error);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setNotificationSettingsError(null);
    setIsSavingNotificationSettings(true);
    try {
      if (
        notifications.pushNotifications &&
        isBrowserPushSupported() &&
        isBrowserPushConfigured() &&
        window.Notification.permission === "default"
      ) {
        try {
          await window.Notification.requestPermission();
        } catch {
          // Permission failures are handled after save through the sync status message.
        }
      }

      const updatedUser = await updateProfile({ notificationSettings: notifications });
      if (!updatedUser) {
        setNotificationSettingsError("Failed to save notification settings");
        return;
      }
      onUpdateUser(updatedUser);

      if (notifications.pushNotifications) {
        const pushSync = await syncBrowserPushRegistration({
          user: updatedUser as User & { notificationSettings?: { pushNotifications?: boolean } },
          interactive: false,
        });

        if (pushSync.status === "connected") {
          notify.success("Notification settings saved. Browser push is enabled.");
        } else {
          notify.success("Notification settings saved.");
          const pushMessage = pushSync.reason ?? describeWebPushStatus(pushSync.status);
          if (pushMessage) {
            notify.info(pushMessage);
          }
        }
      } else {
        notify.success("Notification settings saved!");
      }
    } catch (err) {
      logger.error("Update notification settings failed", err);
      setNotificationSettingsError(getErrorMessage(err, "Failed to save notification settings"));
    } finally {
      setIsSavingNotificationSettings(false);
    }
  };

  return {
    // Profile form
    formData, setFormData,
    profilePhoto,
    selectedPhotoFile,
    profileErrors, setProfileErrors,
    profileGlobalError, setProfileGlobalError,
    isSavingProfile,
    handleSaveProfile,
    // Notifications & visibility
    notifications, setNotifications,
    mobileVisibility, setMobileVisibility,
    // Dialogs
    showPhotoDialog, setShowPhotoDialog,
    showDeleteDialog: showDeleteDialogState, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    deleteReason, setDeleteReason,
    deleteFeedback, setDeleteFeedback,
    deleteAccountErrors,
    deleteAccountGlobalError,
    showPlanDialog, setShowPlanDialog,
    selectedPlan, setSelectedPlan,
    // Smart alert form
    smartAlertForm, setSmartAlertForm, updateSmartAlertForm,
    smartAlertErrors,
    smartAlertGlobalError,
    clearSmartAlertError,
    editingAlertId,
    notificationSettingsError,
    isSavingNotificationSettings,
    // Handlers
    handlePhotoSelect,
    handlePhotoDelete,
    handleDeleteAccount,
    handleEditAlert,
    handleCreateAlert,
    handleSaveNotificationSettings,
    resetAlertForm,
  };
}
