"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { updateProfile } from "@/lib/api/user/users";
import {
  describeWebPushStatus,
  isBrowserPushConfigured,
  isBrowserPushSupported,
  syncBrowserPushRegistration,
} from "@/lib/notifications/webPush";
import logger from "@/lib/logger";
import {
  MOBILE_VISIBILITY,
  normalizeMobileVisibility as normalizeSharedMobileVisibility,
} from "@shared/constants/mobileVisibility";
import type { User } from "@/types/User";
import type {
  MobileVisibility,
  NotificationPreferences,
  ProfileUser,
} from "@/components/user/profile/types";
import { getErrorMessage } from "./validationMapper";

export const normalizeMobileVisibility = (value: unknown): MobileVisibility => {
  const normalized = normalizeSharedMobileVisibility(value, MOBILE_VISIBILITY.SHOW);
  return normalized === MOBILE_VISIBILITY.ON_REQUEST
    ? MOBILE_VISIBILITY.SHOW
    : normalized;
};

interface UseProfileNotificationsProps {
  user: ProfileUser | null;
  onUpdateUser: (userData: User) => void;
}

export function useProfileNotifications({
  user,
  onUpdateUser
}: UseProfileNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => ({
    adUpdates: user?.notificationSettings?.adUpdates ?? true,
    promotions: user?.notificationSettings?.promotions ?? false,
    emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
    pushNotifications: user?.notificationSettings?.pushNotifications ?? true,
    instantAlerts: user?.notificationSettings?.instantAlerts ?? true,
  }));

  const [mobileVisibility, setMobileVisibility] = useState<MobileVisibility>(() =>
    normalizeMobileVisibility(user?.mobileVisibility)
  );

  const [notificationSettingsError, setNotificationSettingsError] = useState<string | null>(null);
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] = useState(false);

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
    notifications,
    setNotifications,
    mobileVisibility,
    setMobileVisibility,
    notificationSettingsError,
    setNotificationSettingsError,
    isSavingNotificationSettings,
    setIsSavingNotificationSettings,
    handleSaveNotificationSettings,
  };
}
