import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ACCOUNT_COPY from '@/config/copy/account';
import FeatureCard from '@/components/user/FeatureCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Eye, Edit2, Trash2, Crown, Settings2 } from "lucide-react";
import LocationSelector from "@/components/location/LocationSelector";
import type { Location } from "@/lib/api/user/locations";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type {
    SmartAlertFieldErrors,
    SmartAlertFormData,
    SmartAlertListItem,
} from "../types";

type SmartAlertSelection = Pick<Location, "id" | "locationId" | "name" | "display" | "city" | "coordinates">;

interface SmartAlertsTabProps {
    smartAlerts: SmartAlertListItem[];
    savedSearches: SavedSearch[];
    smartAlertForm: SmartAlertFormData;
    updateSmartAlertForm: (updates: Partial<SmartAlertFormData>) => void;
    handleCreateAlert: (location: SmartAlertSelection | null) => void;
    handleToggleAlertStatus: (id: string) => void;
    handleDeleteAlert: (id: string) => void;
    handleDeleteSavedSearch: (id: string) => void;
    handleViewAlertMatches: (alert: SmartAlertListItem) => void;
    handleEditAlert: (alert: SmartAlertListItem) => void;
    editingAlertId: string | null;
    resetAlertForm: () => void;
    setActiveTab: (tab: string) => void;
    loading?: boolean;
    smartAlertErrors?: SmartAlertFieldErrors;
    smartAlertGlobalError?: string | null;
    clearSmartAlertError?: (field: keyof SmartAlertFieldErrors) => void;
}

export function SmartAlertsTab({
    smartAlerts,
    savedSearches,
    smartAlertForm,
    updateSmartAlertForm,
    handleCreateAlert,
    handleToggleAlertStatus,
    handleDeleteAlert,
    handleDeleteSavedSearch,
    handleViewAlertMatches,
    handleEditAlert,
    editingAlertId,
    resetAlertForm,
    setActiveTab,
    loading,
    smartAlertErrors,
    smartAlertGlobalError,
    clearSmartAlertError,
}: SmartAlertsTabProps) {
    const [selectedLocation, setSelectedLocation] = useState<SmartAlertSelection | null>(null);
    const activeAlerts = smartAlerts.filter((alert) => alert.active !== false).length;
    const isEditing = Boolean(editingAlertId);

    useEffect(() => {
        if (!smartAlertForm.location.trim()) {
            setSelectedLocation(null);
        }
    }, [smartAlertForm.location]);

    useEffect(() => {
        setSelectedLocation(null);
    }, [editingAlertId]);

    const handleLocationSelect = (loc: Location | null) => {
        if (!loc?.coordinates) {
            setSelectedLocation(null);
            updateSmartAlertForm({ location: "", locationId: null });
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
        updateSmartAlertForm({
            location: loc.display || loc.name || loc.city || "",
            locationId: loc.locationId || loc.id || null,
        });
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Alerts...</div>;
    return (
        <div className="space-y-4">
            {/* Smart Alerts Header */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 gap-0">
                <FeatureCard title={(<><Bell className="h-5 w-5 text-blue-600" /> Smart Alerts</>)} description={"Get notified when new ads match your search criteria"} Icon={Bell} />
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Active Alerts</p>
                            <p className="text-xs text-muted-foreground">{activeAlerts} currently running</p>
                        </div>
                        <Badge className="bg-blue-600 text-white">{activeAlerts} Active</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Two Column Layout - Active Alerts & Create/Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Active Smart Alerts */}
                <Card className="gap-0">
                    <FeatureCard title={(<span>Your Active Alerts</span>)} description={ACCOUNT_COPY.smartAlertsDescription} />
                    <CardContent className="space-y-3">
                        {smartAlerts.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No alerts set up yet.</p>}
                        {smartAlerts.map((alert) => (
                            <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold">{alert.name}</h4>
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${alert.active === false ? "bg-slate-100 text-slate-700" : "bg-green-100 text-green-700"}`}
                                            >
                                                {alert.active === false ? "Paused" : "Active"}
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
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 w-full h-11"
                                        onClick={() => handleViewAlertMatches(alert)}
                                    >
                                        <Eye className="h-3 w-3" />
                                        View Ads
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 w-full h-11"
                                        onClick={() => handleEditAlert(alert)}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 w-full h-11"
                                        onClick={() => handleToggleAlertStatus(alert.id)}
                                    >
                                        <Bell className="h-3 w-3" />
                                        {alert.active === false ? "Resume" : "Pause"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 w-full h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDeleteAlert(alert.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
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
                                        className="bg-purple-600 hover:bg-purple-700 text-white h-11"
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
                                                className="h-11 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    <Card className="gap-0">
                        <CardHeader>
                            <CardTitle className="text-base">{isEditing ? "Edit Alert" : "Create New Alert"}</CardTitle>
                            <CardDescription>
                                {isEditing ? "Update this smart alert without leaving the page" : "Set up a new smart alert for your search"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="smart-alert-name" className="text-sm">Alert Name</Label>
                                    <Input
                                        id="smart-alert-name"
                                        placeholder="e.g., iPhone 14 Pro in New York"
                                        className={`mt-1.5 ${smartAlertErrors?.name ? "border-red-500" : ""}`}
                                        value={smartAlertForm.name}
                                        onChange={(e) => {
                                            if (smartAlertErrors?.name) clearSmartAlertError?.("name");
                                            updateSmartAlertForm({ name: e.target.value });
                                        }}
                                        aria-invalid={!!smartAlertErrors?.name}
                                        aria-describedby={smartAlertErrors?.name ? "smart-alert-name-error" : undefined}
                                    />
                                    <FormError id="smart-alert-name-error" message={smartAlertErrors?.name} />
                                </div>
                                <div>
                                    <Label htmlFor="smart-alert-keywords" className="text-sm">Search Keywords</Label>
                                    <Input
                                        id="smart-alert-keywords"
                                        placeholder="e.g., iPhone 14 Pro Max 256GB"
                                        className={`mt-1.5 ${smartAlertErrors?.keywords ? "border-red-500" : ""}`}
                                        value={smartAlertForm.keywords}
                                        onChange={(e) => {
                                            if (smartAlertErrors?.keywords) clearSmartAlertError?.("keywords");
                                            updateSmartAlertForm({ keywords: e.target.value });
                                        }}
                                        aria-invalid={!!smartAlertErrors?.keywords}
                                        aria-describedby={smartAlertErrors?.keywords ? "smart-alert-keywords-error" : undefined}
                                    />
                                    <FormError id="smart-alert-keywords-error" message={smartAlertErrors?.keywords} />
                                </div>
                                <div>
                                    <Label htmlFor="smart-alert-category" className="text-sm">Category</Label>
                                    <Input
                                        id="smart-alert-category"
                                        placeholder="Mobile Phones"
                                        className={`mt-1.5 ${smartAlertErrors?.category ? "border-red-500" : ""}`}
                                        value={smartAlertForm.category}
                                        onChange={(e) => {
                                            if (smartAlertErrors?.category) clearSmartAlertError?.("category");
                                            updateSmartAlertForm({ category: e.target.value });
                                        }}
                                        aria-invalid={!!smartAlertErrors?.category}
                                        aria-describedby={smartAlertErrors?.category ? "smart-alert-category-error" : undefined}
                                    />
                                    <FormError id="smart-alert-category-error" message={smartAlertErrors?.category} />
                                </div>
                                <div>
                                    <Label htmlFor="smart-alert-location" className="text-sm">Location</Label>
                                    <div className="mt-1.5">
                                        <LocationSelector variant="inline"
                                            currentDisplay={smartAlertForm.location || undefined}
                                            onLocationSelect={handleLocationSelect}
                                        />
                                    </div>
                                    <FormError message={smartAlertErrors?.location} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="smart-alert-radius" className="text-sm">Location Radius</Label>
                                        <span className="text-sm font-medium text-green-600">{smartAlertForm.radius} km</span>
                                    </div>
                                    <input
                                        id="smart-alert-radius"
                                        name="smart-alert-radius"
                                        type="range"
                                        min="5"
                                        max="500"
                                        value={smartAlertForm.radius}
                                        onChange={(e) => {
                                            if (smartAlertErrors?.radius) clearSmartAlertError?.("radius");
                                            updateSmartAlertForm({ radius: parseInt(e.target.value, 10) });
                                        }}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                        <span>5 km</span>
                                        <span>500 km</span>
                                    </div>
                                    <FormError message={smartAlertErrors?.radius} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label htmlFor="smart-alert-email-notify" className="text-sm font-medium">Email Notifications</Label>
                                        <p className="text-xs text-muted-foreground">Prefer email for this alert. Final delivery still respects account notification settings.</p>
                                    </div>
                                    <Switch
                                        id="smart-alert-email-notify"
                                        checked={smartAlertForm.emailNotifications}
                                        onCheckedChange={(checked) => updateSmartAlertForm({ emailNotifications: checked })}
                                    />
                                </div>
                                <FormError message={smartAlertGlobalError} />
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 gap-2 text-white"
                                    onClick={() => handleCreateAlert(selectedLocation)}
                                >
                                    <Bell className="h-4 w-4" />
                                    {isEditing ? "Save Changes" : "Create Alert"}
                                </Button>
                                {isEditing && (
                                    <Button
                                        className="w-full gap-2"
                                        variant="outline"
                                        onClick={resetAlertForm}
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                                    Smart alert delivery is managed from Account Settings now. Use email, push, and instant-alert toggles there to control how alerts are delivered.
                                </div>
                                <Button
                                    className="w-full gap-2"
                                    variant="outline"
                                    onClick={() => setActiveTab("settings")}
                                >
                                    <Settings2 className="h-4 w-4" />
                                    Open Notification Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
