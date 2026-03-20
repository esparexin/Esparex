import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ACCOUNT_COPY from '@/config/copy/account';
import FeatureCard from '@/components/user/FeatureCard';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Trash2, AlertTriangle } from "lucide-react";
import type { NotificationPreferences } from "../types";

interface SettingsTabProps {
    notifications: NotificationPreferences;
    setNotifications: (n: NotificationPreferences) => void;
    setShowDeleteDialog: (show: boolean) => void;
}

export function SettingsTab({
    notifications,
    setNotifications,
    setShowDeleteDialog,
}: SettingsTabProps) {
    return (
        <div className="space-y-4">
            <Card>
                <FeatureCard title={(<><SettingsIcon className="h-5 w-5" /> Notification Settings</>)} description={ACCOUNT_COPY.notificationsDescription} Icon={SettingsIcon} />
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Ad Updates</p>
                            <p className="text-xs text-muted-foreground">Updates about your posted ads</p>
                        </div>
                        <Switch
                            checked={notifications.adUpdates}
                            onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, adUpdates: checked })
                            }
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Promotions</p>
                            <p className="text-xs text-muted-foreground">Special offers and promotions</p>
                        </div>
                        <Switch
                            checked={notifications.promotions}
                            onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, promotions: checked })
                            }
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                            checked={notifications.emailNotifications}
                            onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, emailNotifications: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Delete Account Section */}
            <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete Account
                    </CardTitle>
                    <CardDescription>
                        Permanently delete your account. Secure confirmation required.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="gap-2"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Delete My Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
