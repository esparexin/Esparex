"use client";

import { useId, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, BellRing, Mail, Megaphone, Save, Settings as SettingsIcon, Smartphone, Tag, Trash2 } from "@/icons/IconRegistry";

import { ACCOUNT_COPY } from "@/config/copy/account";
import { Button } from "@esparex/ui";
import { PageSection } from "@/components/layout";
import { FormError } from "@/components/ui/FormError";
import { Separator } from "@/components/ui/separator";
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
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
};

function SettingRow({ icon, title, description, checked, onCheckedChange }: SettingRowProps) {
    const titleId = useId();
    const descId = useId();
    return (
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div>
                    <p id={titleId} className="font-medium text-sm">{title}</p>
                    <p id={descId} className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <Switch aria-labelledby={titleId} aria-describedby={descId} checked={checked} onCheckedChange={onCheckedChange} />
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
            adUpdates: user?.notificationSettings?.adUpdates ?? true,
            promotions: user?.notificationSettings?.promotions ?? false,
            emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
            pushNotifications: user?.notificationSettings?.pushNotifications ?? true,
            instantAlerts: user?.notificationSettings?.instantAlerts ?? true,
        },
    });

    const isSaving = form.formState.isSubmitting;

    const onSubmit = async (data: NotificationSettingsValues) => {
        setGlobalError(null);

        try {
            if (
                data.pushNotifications &&
                isBrowserPushSupported() &&
                isBrowserPushConfigured() &&
                window.Notification.permission === "default"
            ) {
                try {
                    await window.Notification.requestPermission();
                } catch {
                    // Handled through the sync status message later
                }
            }

            const updatedUser = await updateProfile({ notificationSettings: data });
            if (!updatedUser) {
                setGlobalError("Failed to save notification settings");
                return;
            }
            
            onUpdateUser(updatedUser);

            if (data.pushNotifications) {
                const pushSync = await syncBrowserPushRegistration({
                    user: updatedUser as UserType & { notificationSettings?: { pushNotifications?: boolean } },
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
        } catch (err: unknown) {
            logger.error("Update notification settings failed", err);
            setGlobalError(err instanceof Error ? err.message : "Failed to save notification settings");
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
            <PageSection
                variant="bordered"
                title={
                    <span className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <SettingsIcon className="h-5 w-5 text-blue-600" />
                        Notification Settings
                    </span>
                }
                subtitle={ACCOUNT_COPY.notificationsDescription}
            >
                <div className="space-y-4 pt-1">
                    <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-link-dark leading-relaxed">
                        These toggles control the notifications you actually receive. Smart alert delivery also respects
                        the email, push, and instant-alert settings below.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-6 pt-2">
                        <Controller
                            name="adUpdates"
                            control={form.control}
                            render={({ field }) => (
                                <SettingRow
                                    icon={<Tag className="h-4 w-4" />}
                                    title="Ad and business updates"
                                    description="Status changes on your listings and business account."
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Controller
                            name="promotions"
                            control={form.control}
                            render={({ field }) => (
                                <SettingRow
                                    icon={<Megaphone className="h-4 w-4" />}
                                    title="Promotions and announcements"
                                    description="Admin broadcasts, offers, and platform announcements."
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Controller
                            name="emailNotifications"
                            control={form.control}
                            render={({ field }) => (
                                <SettingRow
                                    icon={<Mail className="h-4 w-4" />}
                                    title="Email delivery"
                                    description="Allow notifications to be delivered by email."
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Controller
                            name="pushNotifications"
                            control={form.control}
                            render={({ field }) => (
                                <SettingRow
                                    icon={<Smartphone className="h-4 w-4" />}
                                    title="Push delivery"
                                    description="Allow notifications to be delivered as browser or app push on supported devices."
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Controller
                            name="instantAlerts"
                            control={form.control}
                            render={({ field }) => (
                                <SettingRow
                                    icon={<BellRing className="h-4 w-4" />}
                                    title="Instant smart alerts"
                                    description="Receive matching smart alerts immediately instead of suppressing them."
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    
                    <Separator className="my-3" />
                    <FormError message={globalError} />
                    <Button
                        type="submit"
                        className="w-full md:w-auto h-10 gap-2 text-xs font-semibold px-6"
                        variant="outline"
                        disabled={isSaving}
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Notification Settings"}
                    </Button>
                </div>
            </PageSection>

            <PageSection
                variant="bordered"
                className="border-red-200 bg-red-50/30"
                title={
                    <span className="text-base font-semibold flex items-center gap-2 text-red-600">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                    </span>
                }
                subtitle="Permanently delete your account. Secure confirmation required."
            >
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-10 gap-2 text-xs font-semibold px-5"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Delete My Account
                    </Button>
                </div>
            </PageSection>
        </form>
    );
}
