import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ACCOUNT_COPY from '@/config/copy/account';
import FeatureCard from '@/components/user/FeatureCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Eye, Edit2, Trash2, Crown, Save } from "lucide-react";
import LocationSelector from "@/components/location/LocationSelector";
import type { Location } from "@/lib/api/user/locations";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type {
    SmartAlertListItem,
    SmartAlertPreferences,
} from "../types";

type SmartAlertSelection = Pick<Location, "id" | "locationId" | "name" | "display" | "city" | "coordinates">;

interface SmartAlertsTabProps {
    smartAlerts: SmartAlertListItem[];
    savedSearches: SavedSearch[];
    newAlertName: string;
    setNewAlertName: (v: string) => void;
    newAlertKeywords: string;
    setNewAlertKeywords: (v: string) => void;
    newAlertCategory: string;
    setNewAlertCategory: (v: string) => void;
    newAlertLocation: string;
    setNewAlertLocation: (v: string) => void;
    newAlertRadius: number;
    setNewAlertRadius: (v: number) => void;
    createAlertEmail: boolean;
    setCreateAlertEmail: (v: boolean) => void;
    alertPreferences: SmartAlertPreferences;
    setAlertPreferences: (v: SmartAlertPreferences) => void;
    handleCreateAlert: (location: SmartAlertSelection | null) => void;
    handleDeleteAlert: (id: string) => void;
    handleDeleteSavedSearch: (id: string) => void;
    handleViewAlertMatches: (alert: SmartAlertListItem) => void;
    handleEditAlert: () => void;
    handleSavePreferences?: () => void;
    setActiveTab: (tab: string) => void;
    loading?: boolean;
    createAlertErrors?: {
        name?: string;
        keywords?: string;
    };
    createAlertGlobalError?: string | null;
    preferencesGlobalError?: string | null;
    isSavingPreferences?: boolean;
    clearCreateAlertError?: (field: "name" | "keywords") => void;
}

export function SmartAlertsTab({
    smartAlerts,
    savedSearches,
    newAlertName,
    setNewAlertName,
    newAlertKeywords,
    setNewAlertKeywords,
    newAlertCategory,
    setNewAlertCategory,
    newAlertLocation,
    setNewAlertLocation,
    newAlertRadius,
    setNewAlertRadius,
    createAlertEmail,
    setCreateAlertEmail,
    alertPreferences,
    setAlertPreferences,
    handleCreateAlert,
    handleDeleteAlert,
    handleDeleteSavedSearch,
    handleViewAlertMatches,
    handleEditAlert,
    handleSavePreferences,
    setActiveTab,
    loading,
    createAlertErrors,
    createAlertGlobalError,
    preferencesGlobalError,
    isSavingPreferences,
    clearCreateAlertError,
}: SmartAlertsTabProps) {
    const [selectedLocation, setSelectedLocation] = useState<SmartAlertSelection | null>(null);

    useEffect(() => {
        if (!newAlertLocation.trim()) {
            setSelectedLocation(null);
        }
    }, [newAlertLocation]);

    const handleLocationSelect = (loc: Location | null) => {
        if (!loc?.coordinates) {
            setSelectedLocation(null);
            setNewAlertLocation("");
            return;
        }

        setSelectedLocation({
            id: loc.id,
            locationId: loc.locationId,
            name: loc.name,
            display: loc.display,
            city: loc.city,
            coordinates: loc.coordinates,
        });
        setNewAlertLocation(loc.display || loc.name || loc.city || "");
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Alerts...</div>;
    return (
        <div className="space-y-4">
            {/* Smart Alerts Header */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <FeatureCard title={(<><Bell className="h-5 w-5 text-blue-600" /> Smart Alerts</>)} description={"Get notified when new ads match your search criteria"} Icon={Bell} />
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Active Alerts</p>
                            <p className="text-xs text-muted-foreground">{smartAlerts.length} active alerts</p>
                        </div>
                        <Badge className="bg-blue-600 text-white">{smartAlerts.length} Active</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Two Column Layout - Active Alerts & Create/Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Active Smart Alerts */}
                <Card>
                    <FeatureCard title={(<span>Your Active Alerts</span>)} description={ACCOUNT_COPY.smartAlertsDescription} />
                    <CardContent className="space-y-3">
                        {smartAlerts.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No alerts set up yet.</p>}
                        {smartAlerts.map((alert) => (
                            <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">{alert.name}</h4>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                Active
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {alert.keywords}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Category: {alert.category} • Location: {alert.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Last match</span>
                                            <span className="font-medium">{alert.lastMatch}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Total matches</span>
                                            <span className="font-medium">{alert.totalMatches} ads</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t text-sm">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 flex-1"
                                        onClick={() => handleViewAlertMatches(alert)}
                                    >
                                        <Eye className="h-3 w-3" />
                                        View Ads
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 flex-1"
                                        onClick={() => handleEditAlert()}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteAlert(alert.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Deactivate
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Upgrade CTA */}
                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Crown className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">Want more alerts?</h4>
                                        <p className="text-xs text-muted-foreground">Upgrade to Premium for unlimited smart alerts</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => setActiveTab("plans")}
                                    >
                                        Upgrade
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-900">Saved Searches</h4>
                            {savedSearches.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No saved searches yet.</p>
                            ) : (
                                savedSearches.map((search) => (
                                    <div key={search.id} className="border rounded-lg p-3 space-y-2">
                                        <p className="text-sm font-medium text-slate-900">
                                            {search.query?.trim() || "Saved search"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {typeof search.priceMin === "number" || typeof search.priceMax === "number"
                                                ? `Price: ${typeof search.priceMin === "number" ? `₹${search.priceMin}` : "Any"} - ${typeof search.priceMax === "number" ? `₹${search.priceMax}` : "Any"}`
                                                : "Price: Any"}
                                        </p>
                                        <div className="flex items-center justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteSavedSearch(search.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Create New Alert & Settings */}
                <div className="space-y-4">
                    {/* Create New Alert */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Create New Alert</CardTitle>
                            <CardDescription>
                                Set up a new smart alert for your search
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="smart-alert-name" className="text-sm">Alert Name</Label>
                                    <Input
                                        id="smart-alert-name"
                                        placeholder="e.g., iPhone 14 Pro in New York"
                                        className={`mt-1.5 ${createAlertErrors?.name ? "border-red-500" : ""}`}
                                        value={newAlertName}
                                        onChange={(e) => {
                                            if (createAlertErrors?.name) clearCreateAlertError?.("name");
                                            setNewAlertName(e.target.value);
                                        }}
                                        aria-invalid={!!createAlertErrors?.name}
                                        aria-describedby={createAlertErrors?.name ? "smart-alert-name-error" : undefined}
                                    />
                                    <FormError id="smart-alert-name-error" message={createAlertErrors?.name} />
                                </div>
                                <div>
                                    <Label htmlFor="smart-alert-keywords" className="text-sm">Search Keywords</Label>
                                    <Input
                                        id="smart-alert-keywords"
                                        placeholder="e.g., iPhone 14 Pro Max 256GB"
                                        className={`mt-1.5 ${createAlertErrors?.keywords ? "border-red-500" : ""}`}
                                        value={newAlertKeywords}
                                        onChange={(e) => {
                                            if (createAlertErrors?.keywords) clearCreateAlertError?.("keywords");
                                            setNewAlertKeywords(e.target.value);
                                        }}
                                        aria-invalid={!!createAlertErrors?.keywords}
                                        aria-describedby={createAlertErrors?.keywords ? "smart-alert-keywords-error" : undefined}
                                    />
                                    <FormError id="smart-alert-keywords-error" message={createAlertErrors?.keywords} />
                                </div>
                                <div>
                                    <Label htmlFor="smart-alert-category" className="text-sm">Category</Label>
                                    <Input
                                        id="smart-alert-category"
                                        placeholder="Mobile Phones"
                                        className="mt-1.5"
                                        value={newAlertCategory}
                                        onChange={(e) => setNewAlertCategory(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="smart-alert-location" className="text-sm">Location</Label>
                                    <div className="mt-1.5">
                                        <LocationSelector variant="inline"
                                            currentDisplay={newAlertLocation || undefined}
                                            onLocationSelect={handleLocationSelect}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="smart-alert-radius" className="text-sm">Location Radius</Label>
                                        <span className="text-sm font-medium text-green-600">{newAlertRadius} km</span>
                                    </div>
                                    <input
                                        id="smart-alert-radius"
                                        name="smart-alert-radius"
                                        type="range"
                                        min="5"
                                        max="500"
                                        value={newAlertRadius}
                                        onChange={(e) => setNewAlertRadius(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                        <span>5 km</span>
                                        <span>500 km</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label htmlFor="smart-alert-email-notify" className="text-sm font-medium">Email Notifications</Label>
                                        <p className="text-xs text-muted-foreground">Get email when new ads match</p>
                                    </div>
                                    <Switch
                                        id="smart-alert-email-notify"
                                        checked={createAlertEmail}
                                        onCheckedChange={setCreateAlertEmail}
                                    />
                                </div>
                                <FormError message={createAlertGlobalError} />
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 gap-2 text-white"
                                    onClick={() => handleCreateAlert(selectedLocation)}
                                >
                                    <Bell className="h-4 w-4" />
                                    Create Alert
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alert Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Alert Preferences</CardTitle>
                            <CardDescription>
                                Configure how you receive alert notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="alert-pref-email" className="text-sm font-medium">Email Notifications</Label>
                                    <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                                </div>
                                <Switch
                                    id="alert-pref-email"
                                    checked={alertPreferences.email}
                                    onCheckedChange={(checked) => setAlertPreferences({ ...alertPreferences, email: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="alert-pref-push" className="text-sm font-medium">Push Notifications</Label>
                                    <p className="text-xs text-muted-foreground">Receive instant push alerts</p>
                                </div>
                                <Switch
                                    id="alert-pref-push"
                                    checked={alertPreferences.push}
                                    onCheckedChange={(checked) => setAlertPreferences({ ...alertPreferences, push: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="alert-pref-daily" className="text-sm font-medium">Daily Summary</Label>
                                    <p className="text-xs text-muted-foreground">Get daily digest of matches</p>
                                </div>
                                <Switch
                                    id="alert-pref-daily"
                                    checked={alertPreferences.dailySummary}
                                    onCheckedChange={(checked) => setAlertPreferences({ ...alertPreferences, dailySummary: checked })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="alert-pref-instant" className="text-sm font-medium">Instant Alerts</Label>
                                    <p className="text-xs text-muted-foreground">Get notified immediately for new matches</p>
                                </div>
                                <Switch
                                    id="alert-pref-instant"
                                    checked={alertPreferences.instant}
                                    onCheckedChange={(checked) => setAlertPreferences({ ...alertPreferences, instant: checked })}
                                />
                            </div>
                            <Separator />
                            <FormError message={preferencesGlobalError} />
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={handleSavePreferences}
                                disabled={isSavingPreferences}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSavingPreferences ? "Saving..." : "Save Preferences"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
