"use client";

import { useState, useEffect } from "react";
import { notify } from "@/lib/notify";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/api/routes";
import type { User } from "@/types/User";
import { mapErrorToMessage } from "@/utils/errorMapper";
import logger from "@/lib/logger";
import { updateProfile } from "@/api/user/users";
import type { SmartAlert } from "@/hooks/useSmartAlerts";
import { SmartAlertCreateSchema } from "@shared/schemas/smartAlert.schema";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";
import type { Location as AppLocation } from "@/api/user/locations";
import { sanitizeMongoObjectId } from "@shared/listingUtils/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";

/* ---- Local Types (re-exported for the sidebar to use) ---- */
export type MobileVisibility = "show" | "hide" | "on-request";

export type NotificationPreferences = {
  adUpdates: boolean;
  promotions: boolean;
  emailNotifications: boolean;
};

export type UserNotificationSettings = NotificationPreferences & {
  pushNotifications?: boolean;
  dailyDigest?: boolean;
  instantAlerts?: boolean;
};

export type ProfileUser = User & {
  businessName?: string;
  gstNumber?: string;
  notificationSettings?: UserNotificationSettings;
  mobileVisibility?: MobileVisibility | "public";
  plan?: string;
  phone?: string;
};

export type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  gstNumber?: string;
};

export type ProfileFieldErrors = {
  name?: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  photo?: string;
};

export type MobileRequest = {
  id: string;
  buyerName: string;
  adTitle: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
};

export type SmartAlertItem = {
  id: string;
  name: string;
  keywords: string;
  category: string;
  location: string;
  locationId?: string;
  radius?: number;
  lastMatch?: string;
  totalMatches?: number;
};

type SmartAlertLocationSelection = Pick<
  AppLocation,
  "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

/* ---- Module-level helpers ---- */
export const normalizeMobileVisibility = (value: unknown): MobileVisibility => {
  if (value === "show" || value === "hide" || value === "on-request") return value;
  if (value === "public") return "show";
  return "show";
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

export const toSmartAlertItem = (alert: SmartAlert): SmartAlertItem => {
  const record = alert as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : "Smart Alert";

  const criteriaRaw = record.criteria;
  const criteria = typeof criteriaRaw === "object" && criteriaRaw !== null ? (criteriaRaw as Record<string, unknown>) : null;

  const keywords = typeof criteria?.keywords === "string" ? criteria.keywords : "";
  const category = typeof criteria?.category === "string" ? criteria.category : "";
  const locationId = typeof criteria?.locationId === "string" ? criteria.locationId : undefined;

  let location = "";
  let radius: number | undefined =
    typeof record.radiusKm === "number" ? record.radiusKm : undefined;

  if (typeof criteria?.location === "string") {
    location = criteria.location;
  } else if (typeof criteria?.location === "object" && criteria.location !== null) {
    const locObj = criteria.location as { city?: string; radius?: number };
    location = locObj.city || "";
    radius = locObj.radius;
  }

  const lastMatch = typeof record.lastMatch === "string" ? record.lastMatch : undefined;
  const totalMatches = typeof record.totalMatches === "number" ? record.totalMatches : undefined;

  return { id: alert.id, name, keywords, category, location, locationId, radius, lastMatch, totalMatches };
};

/* ---- Hook params ---- */
export interface UseProfileSettingsParams {
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
  onLogout: () => void;
  createSmartAlert: (data: SmartAlertCreatePayload) => Promise<unknown>;
}

/* ---- Hook ---- */
export function useProfileSettings({
  user,
  onUpdateUser,
  onLogout,
  createSmartAlert,
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
  }));

  /* Mobile visibility */
  const [mobileVisibility, setMobileVisibility] = useState<MobileVisibility>(() =>
    normalizeMobileVisibility((user as ProfileUser | null)?.mobileVisibility)
  );
  const [mobileRequests, setMobileRequests] = useState<MobileRequest[]>([]);

  /* Dialog / visibility states */
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  /* Business form states */
  const [showBusinessEditForm, setShowBusinessEditForm] = useState(false);

  /* Smart alert form states */
  const [newAlertName, setNewAlertName] = useState("");
  const [newAlertKeywords, setNewAlertKeywords] = useState("");
  const [newAlertCategory, setNewAlertCategory] = useState("");
  const [newAlertLocation, setNewAlertLocation] = useState("");
  const [newAlertRadius, setNewAlertRadius] = useState(50);
  const [createAlertEmail, setCreateAlertEmail] = useState(true);
  const [createAlertErrors, setCreateAlertErrors] = useState<{ name?: string; keywords?: string }>({});
  const [createAlertGlobalError, setCreateAlertGlobalError] = useState<string | null>(null);
  const [alertPreferencesError, setAlertPreferencesError] = useState<string | null>(null);
  const [isSavingAlertPreferences, setIsSavingAlertPreferences] = useState(false);
  const [alertPreferences, setAlertPreferences] = useState({
    email: user?.notificationSettings?.emailNotifications ?? true,
    push: user?.notificationSettings?.pushNotifications ?? true,
    dailySummary: user?.notificationSettings?.dailyDigest ?? false,
    instant: user?.notificationSettings?.instantAlerts ?? true,
  });

  /* Sync from user prop */
  useEffect(() => {
    if (!user) {
      setProfilePhoto(null);
      setSelectedPhotoFile(null);
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
    if (profileUser.mobileVisibility) setMobileVisibility(normalizeMobileVisibility(profileUser.mobileVisibility));
    if (user.notificationSettings) {
      setNotifications({
        adUpdates: user.notificationSettings.adUpdates ?? true,
        promotions: user.notificationSettings.promotions ?? false,
        emailNotifications: user.notificationSettings.emailNotifications ?? true,
      });
    }
  }, [user]);

  /* ------ Handlers ------ */

  const handleSaveProfile = async () => {
    const nextErrors: ProfileFieldErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required.";
    } else if (trimmedName.length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors((prev) => ({ ...prev, ...nextErrors }));
      setProfileGlobalError(null);
      return;
    }

    setProfileErrors((prev) => ({ ...prev, name: undefined, email: undefined, businessName: undefined, gstNumber: undefined }));
    setProfileGlobalError(null);
    setIsSavingProfile(true);

    const submitData = new FormData();
    submitData.append("name", trimmedName);
    if (trimmedEmail) submitData.append("email", trimmedEmail);
    const businessName = formData.businessName?.trim();
    if (businessName) submitData.append("businessName", businessName);
    const gstNumber = formData.gstNumber?.trim();
    if (gstNumber) submitData.append("gstNumber", gstNumber);
    submitData.append("mobileVisibility", mobileVisibility);
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
      setProfileErrors((prev) => ({ ...prev, photo: undefined }));
      notify.success("Profile updated successfully!");
    } catch (err) {
      const mappedValidation = mapProfileValidationError(err);
      if (mappedValidation) {
        const hasFieldErrors = Object.values(mappedValidation.fieldErrors).some(Boolean);
        setProfileErrors((prev) => ({
          ...prev,
          name: undefined, email: undefined, businessName: undefined, gstNumber: undefined, photo: undefined,
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

  const handleDeleteAccount = () => {
    apiClient.delete(API_ROUTES.USER.USERS_ME)
      .then(() => {
        notify.success("Account deleted successfully");
        localStorage.removeItem("esparex_user_session");
        onLogout();
      })
      .catch(err => {
        logger.error("Delete account failed", err);
        setProfileGlobalError("Failed to delete account");
      });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileErrors((prev) => ({ ...prev, photo: "Please select an image file." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
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

  const handleCreateAlert = async (
    selectedLocation: SmartAlertLocationSelection | null = null
  ): Promise<void> => {
    const nextErrors: { name?: string; keywords?: string } = {};
    if (!newAlertName.trim()) nextErrors.name = "Alert name is required.";
    if (!newAlertKeywords.trim()) nextErrors.keywords = "Search keywords are required.";
    if (Object.keys(nextErrors).length > 0) {
      setCreateAlertErrors(nextErrors);
      setCreateAlertGlobalError(null);
      return;
    }
    setCreateAlertErrors({});
    setCreateAlertGlobalError(null);

    const canonicalCoordinates = toCanonicalGeoPoint(selectedLocation?.coordinates);
    const canonicalLocationId = sanitizeMongoObjectId(
      selectedLocation?.locationId || selectedLocation?.id
    );
    const locationDisplay =
      selectedLocation?.display ||
      selectedLocation?.name ||
      selectedLocation?.city ||
      newAlertLocation.trim() ||
      "";

    if (!canonicalCoordinates || !canonicalLocationId || !locationDisplay) {
      setCreateAlertGlobalError("Please select a valid location from the location search.");
      return;
    }

    const parsedPayload = SmartAlertCreateSchema.safeParse({
      name: newAlertName,
      criteria: {
        keywords: newAlertKeywords,
        category: newAlertCategory || undefined,
        location: locationDisplay,
        locationId: canonicalLocationId,
      },
      coordinates: canonicalCoordinates,
      radiusKm: newAlertRadius,
      frequency: "instant",
      notificationChannels: createAlertEmail ? ["email"] : ["push"],
    });

    if (!parsedPayload.success) {
      const firstIssue = parsedPayload.error.issues[0];
      setCreateAlertGlobalError(firstIssue?.message || "Please check alert details and try again.");
      return;
    }

    const requestPayload = {
      ...parsedPayload.data,
      criteria: {
        ...(parsedPayload.data.criteria || {}),
        coordinates: canonicalCoordinates,
      },
    } as SmartAlertCreatePayload;

    const result = await createSmartAlert(requestPayload);
    if (typeof result === "object" && result !== null && "success" in result && (result as any).success) {
      setNewAlertName(""); setNewAlertKeywords(""); setNewAlertCategory(""); setNewAlertLocation("");
      setNewAlertRadius(50);
      setCreateAlertEmail(true);
    } else {
      setCreateAlertGlobalError((result as any).error);
    }
  };

  const handleSaveAlertPreferences = async () => {
    setAlertPreferencesError(null);
    setIsSavingAlertPreferences(true);
    const updatedSettings = {
      ...notifications,
      emailNotifications: alertPreferences.email,
      pushNotifications: alertPreferences.push,
      dailyDigest: alertPreferences.dailySummary,
      instantAlerts: alertPreferences.instant,
    };
    try {
      const updatedUser = await updateProfile({ notificationSettings: updatedSettings });
      if (!updatedUser) { setAlertPreferencesError("Failed to save preferences"); return; }
      onUpdateUser(updatedUser);
      notify.success("Alert preferences saved!");
    } catch (err) {
      logger.error("Update preferences failed", err);
      setAlertPreferencesError(getErrorMessage(err, "Failed to save preferences"));
    } finally {
      setIsSavingAlertPreferences(false);
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
    mobileRequests, setMobileRequests,
    // Dialogs
    showPhotoDialog, setShowPhotoDialog,
    showDeleteDialog, setShowDeleteDialog,
    deleteConfirmText, setDeleteConfirmText,
    showPlanDialog, setShowPlanDialog,
    selectedPlan, setSelectedPlan,
    // Business forms
    showBusinessEditForm, setShowBusinessEditForm,
    // Smart alert form
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
    // Handlers
    handlePhotoSelect,
    handlePhotoDelete,
    handleDeleteAccount,
    handleCreateAlert,
    handleSaveAlertPreferences,
  };
}
