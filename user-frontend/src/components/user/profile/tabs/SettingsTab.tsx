import type { ReactNode } from "react";
import { AlertTriangle, BellRing, Mail, Megaphone, Save, Settings as SettingsIcon, Smartphone, Tag, Trash2 } from "lucide-react";

import FeatureCard from "@/components/user/FeatureCard";
import ACCOUNT_COPY from "@/config/copy/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/FormError";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { NotificationPreferences } from "../types";

interface SettingsTabProps {
    notifications: NotificationPreferences;
    setNotifications: (n: NotificationPreferences) => void;
    handleSaveNotificationSettings: () => void;
    isSavingNotificationSettings?: boolean;
    notificationSettingsError?: string | null;
    setShowDeleteDialog: (show: boolean) => void;
}

type SettingRowProps = {
    icon: ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
};

function SettingRow({ icon, title, description, checked, onCheckedChange }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between gap-3 min-h-[44px]">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

const updateNotificationSettings = (
    current: NotificationPreferences,
    nextPartial: Partial<NotificationPreferences>,
    setNotifications: (value: NotificationPreferences) => void
) => {
    setNotifications({ ...current, ...nextPartial });
};

export function SettingsTab({
    notifications,
    setNotifications,
    handleSaveNotificationSettings,
    isSavingNotificationSettings = false,
    notificationSettingsError,
    setShowDeleteDialog,
}: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <Card className="gap-0">
                <FeatureCard
                    title={
                        <>
                            <SettingsIcon className="h-5 w-5" /> Notification Settings
                        </>
                    }
                    description={ACCOUNT_COPY.notificationsDescription}
                    Icon={SettingsIcon}
                />
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-link-dark">
                        These toggles control the notifications you actually receive. Smart alert delivery also respects
                        the email, push, and instant-alert settings below.
                    </div>

                    <SettingRow
                        icon={<Tag className="h-4 w-4" />}
                        title="Ad and business updates"
                        description="Status changes on your listings and business account."
                        checked={notifications.adUpdates}
                        onCheckedChange={(checked) =>
                            updateNotificationSettings(notifications, { adUpdates: checked }, setNotifications)
                        }
                    />
                    <Separator />
                    <SettingRow
                        icon={<Megaphone className="h-4 w-4" />}
                        title="Promotions and announcements"
                        description="Admin broadcasts, offers, and platform announcements."
                        checked={notifications.promotions}
                        onCheckedChange={(checked) =>
                            updateNotificationSettings(notifications, { promotions: checked }, setNotifications)
                        }
                    />
                    <Separator />
                    <SettingRow
                        icon={<Mail className="h-4 w-4" />}
                        title="Email delivery"
                        description="Allow notifications to be delivered by email."
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                            updateNotificationSettings(notifications, { emailNotifications: checked }, setNotifications)
                        }
                    />
                    <Separator />
                    <SettingRow
                        icon={<Smartphone className="h-4 w-4" />}
                        title="Push delivery"
                        description="Allow notifications to be delivered as browser or app push on supported secure devices. Saving will ask for browser permission when available."
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) =>
                            updateNotificationSettings(notifications, { pushNotifications: checked }, setNotifications)
                        }
                    />
                    <Separator />
                    <SettingRow
                        icon={<BellRing className="h-4 w-4" />}
                        title="Instant smart alerts"
                        description="Receive matching smart alerts immediately instead of suppressing them."
                        checked={notifications.instantAlerts}
                        onCheckedChange={(checked) =>
                            updateNotificationSettings(notifications, { instantAlerts: checked }, setNotifications)
                        }
                    />

                    <Separator />
                    <FormError message={notificationSettingsError} />
                    <Button
                        className="w-full h-11 gap-2"
                        variant="outline"
                        onClick={handleSaveNotificationSettings}
                        disabled={isSavingNotificationSettings}
                    >
                        <Save className="h-4 w-4" />
                        {isSavingNotificationSettings ? "Saving..." : "Save Notification Settings"}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 gap-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete Account
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Permanently delete your account. Secure confirmation required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-11 gap-2"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Delete My Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
