"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { updateProfile } from "@/lib/api/user/users";
import {
  isAllowedProfilePhotoType,
  PROFILE_PHOTO_ALLOWED_LABEL,
  PROFILE_PHOTO_MAX_BYTES,
} from "@/lib/uploads/profilePhotoUpload";
import { profileFormSchema } from "@/schemas/profileSettings.schema";
import type { User } from "@/types/User";
import type {
  ProfileFieldErrors,
  ProfileFormData,
  ProfileUser,
  MobileVisibility,
  NotificationPreferences,
} from "@/components/user/profile/types";
import {
  emptyProfileFieldErrors,
  mapProfileValidationError,
  getErrorMessage,
} from "./validationMapper";

interface UseProfileIdentityProps {
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
  notifications: NotificationPreferences;
  mobileVisibility: MobileVisibility;
}

export function useProfileIdentity({
  user,
  onUpdateUser,
  notifications,
  mobileVisibility
}: UseProfileIdentityProps) {
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
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

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
      if (!updatedUser) {
        setProfileGlobalError("Failed to update profile.");
        return;
      }
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

  return {
    formData,
    setFormData,
    profilePhoto,
    setProfilePhoto,
    selectedPhotoFile,
    setSelectedPhotoFile,
    profileErrors,
    setProfileErrors,
    profileGlobalError,
    setProfileGlobalError,
    isSavingProfile,
    setIsSavingProfile,
    showPhotoDialog,
    setShowPhotoDialog,
    handleSaveProfile,
    handlePhotoSelect,
    handlePhotoDelete,
  };
}
