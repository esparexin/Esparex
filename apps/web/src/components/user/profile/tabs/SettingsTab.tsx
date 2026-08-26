"use client";

import { useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, BellRing, Trash2 } from "@/icons/IconRegistry";

import { Button } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { Switch } from "@/components/ui/switch";
import { updateProfile } from "@/lib/api/user/users";
import { notify } from "@/lib/feedback";
import {
  describeWebPushStatus,
  isBrowserPushConfigured,
  isBrowserPushSupported,
  syncBrowserPushRegistration,
} from "@/lib/notifications/webPush";
import logger from "@/lib/logger";
import { notificationSettingsSchema, type NotificationSettingsValues } from "@esparex/contracts";
import type { User as UserType } from "@/types/User";
import type { ProfileUser } from "../types";

interface SettingsTabProps {
    user: ProfileUser | null;
    onUpdateUser: (userData: UserType) => void;
    setShowDeleteDialog: (show: boolean) => void;
}

type SettingRowProps = {
    icon: React.ReactNode;
    title: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
};

function SettingRow({ icon, title, description, checked, onCheckedChange }: SettingRowProps) {
    const titleId = useId();
    return (
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                    {icon}
                </div>
                <div className="space-y-0.5 min-w-0">
                    <p id={titleId} className="font-bold text-caption sm:text-body text-foreground">{title}</p>
                    {description && (
                        <p className="text-tiny text-muted-foreground leading-relaxed">{description}</p>
                    )}
                </div>
            </div>
            <Switch aria-labelledby={titleId} checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
        </div>
    );
}

export function SettingsTab({
    user,
    onUpdateUser,
    setShowDeleteDialog,
}: SettingsTabProps) {
    const [globalError, setGlobalError] = useState<string | null>(null);

    const form = useForm<NotificationSettingsValues>({
        resolver: zodResolver(notificationSettingsSchema),
        defaultValues: {
            enabled:
                user?.notificationSettings?.enabled ??
                (user?.notificationSettings?.pushNotifications !== false &&
                 user?.notificationSettings?.adUpdates !== false),
            instantAlerts: user?.notificationSettings?.instantAlerts ?? true,
        },
    });

    const handleToggle = async (key: keyof NotificationSettingsValues, value: boolean) => {
        setGlobalError(null);
        const currentValues = form.getValues();
        const newValues: NotificationSettingsValues = {
            ...currentValues,
            [key]: value,
        };

        form.setValue(key, value);

        try {
            if (
                key === "enabled" &&
                value &&
                isBrowserPushSupported() &&
                isBrowserPushConfigured() &&
                window.Notification.permission === "default"
            ) {
                try {
                    await window.Notification.requestPermission();
                } catch {
                    // Handled gracefully
                }
            }

            const updatedUser = await updateProfile({ notificationSettings: newValues });
            if (!updatedUser) {
                setGlobalError("Failed to update notification settings");
                form.setValue(key, !value);
                return;
            }

            onUpdateUser(updatedUser);

            if (key === "enabled" && value) {
                const pushSync = await syncBrowserPushRegistration({
                    user: updatedUser as UserType & { notificationSettings?: { enabled?: boolean; pushNotifications?: boolean } },
                    interactive: false,
                });

                if (pushSync.status === "connected") {
                    notify.success("Notification settings enabled with browser push.");
                } else {
                    notify.success("Notification settings updated.");
                    const pushMessage = pushSync.reason ?? describeWebPushStatus(pushSync.status);
                    if (pushMessage) {
                        notify.info(pushMessage);
                    }
                }
            } else {
                notify.success("Notification setting updated.");
            }
        } catch (err: unknown) {
            logger.error("Update notification settings failed", err);
            form.setValue(key, !value);
            setGlobalError(err instanceof Error ? err.message : "Failed to update notification settings");
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border/60 overflow-hidden">
                <Controller
                    name="enabled"
                    control={form.control}
                    render={({ field }) => (
                        <SettingRow
                            icon={<BellRing className="h-4.5 w-4.5" />}
                            title="Notification Settings"
                            description="Receive real-time push & email notifications for buyer messages, ad status updates, and smart alert matches."
                            checked={field.value}
                            onCheckedChange={(checked) => handleToggle("enabled", checked)}
                        />
                    )}
                />

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-destructive/[0.02]">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5">
                            <Trash2 className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-caption sm:text-body text-destructive">Delete Account</p>
                            <p className="text-tiny text-muted-foreground leading-relaxed">
                                Permanently delete your account, listings, and saved preferences. Secure confirmation required.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-9 gap-1.5 text-tiny font-semibold px-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Delete Account</span>
                    </Button>
                </div>
            </div>

            {globalError && (
                <div className="pt-1">
                    <FormError message={globalError} />
                </div>
            )}
        </div>
    );
}
