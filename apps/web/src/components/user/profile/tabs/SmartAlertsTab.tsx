import { useState } from "react";
import { PageSection } from "@/components/layout";
import { Button, Card, CardContent } from "@esparex/ui";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Eye, Edit2, Trash2, Crown, Plus } from "@/icons/IconRegistry";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type {
    SmartAlertFieldErrors,
    SmartAlertFormData,
    SmartAlertListItem,
} from "../types";
import { CreateSmartAlertDialog } from "../dialogs/CreateSmartAlertDialog";
import type { Location } from "@/lib/api/user/locations";

type SmartAlertSelection = Pick<Location, "id" | "locationId" | "name" | "display" | "city" | "coordinates">;

interface SmartAlertsTabProps {
    smartAlerts: SmartAlertListItem[];
    savedSearches: SavedSearch[];
    smartAlertForm: SmartAlertFormData;
    updateSmartAlertForm: (updates: Partial<SmartAlertFormData>) => void;
    handleCreateAlert: (location: SmartAlertSelection | null) => Promise<void>;
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
}: SmartAlertsTabProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const activeAlerts = smartAlerts.filter((alert) => alert.active !== false).length;
    const isEditing = Boolean(editingAlertId);

    const handleOpenCreateModal = () => {
        resetAlertForm();
        setIsDialogOpen(true);
    };

    const handleOpenEditModal = (alert: SmartAlertListItem) => {
        handleEditAlert(alert);
        setIsDialogOpen(true);
    };

    const handleSubmitForm = async (location: SmartAlertSelection | null) => {
        await handleCreateAlert(location);
        setIsDialogOpen(false);
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading Alerts...</div>;

    return (
        <div className="space-y-4 sm:space-y-5 w-full">
            {/* Header & Create Action */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <CardContent className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-slate-900 truncate">Smart Alerts</h3>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                    Get instant notifications when new listings match your criteria.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleOpenCreateModal}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-xl shadow-xs gap-1.5 shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Create Smart Alert
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold">
                            {activeAlerts} Active
                        </Badge>
                        <span className="text-xs text-slate-600 font-medium">{activeAlerts} alert{activeAlerts === 1 ? "" : "s"} currently running</span>
                    </div>
                </CardContent>
            </Card>

            {/* Active Alerts List */}
            <PageSection
                variant="bordered"
                title="Your Active Alerts"
                action={<span className="text-xs font-normal text-slate-500">{smartAlerts.length} total</span>}
            >
                <div className="space-y-4 pt-1">
                    {smartAlerts.length === 0 ? (
                        <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200">
                            <Bell className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
                            <p className="text-sm font-semibold text-slate-800">No smart alerts set up yet</p>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                Create an alert using the button above to get notified automatically whenever matching items are posted.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {smartAlerts.map((alert) => (
                                <div key={alert.id} className="border border-slate-200/80 rounded-2xl p-4 space-y-3 bg-white shadow-xs hover:border-blue-200 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm tracking-tight truncate">{alert.name}</h4>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-tiny font-semibold ${
                                                        alert.active === false
                                                            ? "bg-slate-100 text-slate-600"
                                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    }`}
                                                >
                                                    {alert.active === false ? "Paused" : "Active"}
                                                </Badge>
                                            </div>
                                            {alert.keywords && (
                                                <p className="text-xs text-slate-600 font-medium">
                                                    Keywords: <span className="text-slate-900 font-semibold">{alert.keywords}</span>
                                                </p>
                                            )}
                                            <p className="text-tiny text-slate-500 mt-1">
                                                Category: {alert.category || "All"} • Location: {alert.location || "Any"} {alert.radiusKm ? `(${alert.radiusKm} km)` : ""}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Matches Stats */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500 text-tiny">Last match</span>
                                                <span className="font-semibold text-slate-900 text-xs">{alert.lastMatch || "None yet"}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500 text-tiny">Total matches</span>
                                                <span className="font-semibold text-blue-600 text-xs">{alert.totalMatches || 0} ads</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs font-semibold h-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                                            onClick={() => handleViewAlertMatches(alert)}
                                        >
                                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                                            View Ads
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs font-semibold h-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                                            onClick={() => handleOpenEditModal(alert)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs font-semibold h-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                                            onClick={() => handleToggleAlertStatus(alert.id)}
                                        >
                                            <Bell className="h-3.5 w-3.5 text-slate-500" />
                                            {alert.active === false ? "Resume" : "Pause"}
                                        </Button>
                                        {pendingDeleteId === alert.id ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 text-xs font-semibold h-8 rounded-lg text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                                                onClick={() => {
                                                    setPendingDeleteId(null);
                                                    handleDeleteAlert(alert.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Confirm
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 text-xs font-semibold h-8 rounded-lg text-red-600 hover:bg-red-50 border-slate-200"
                                                onClick={() => setPendingDeleteId(alert.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upgrade Banner */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                            <Crown className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">Want unlimited smart alerts?</h4>
                            <p className="text-tiny text-slate-500">Upgrade to Premium to create unlimited alert slots.</p>
                        </div>
                        <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 px-3 rounded-lg shrink-0 shadow-xs"
                            onClick={() => setActiveTab("plans")}
                        >
                            Upgrade
                        </Button>
                    </div>

                    <Separator />

                    {/* Saved Searches Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900">Saved Searches</h4>
                        {savedSearches.length === 0 ? (
                            <p className="text-xs text-slate-500">No saved searches yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {savedSearches.map((search) => (
                                    <div key={search.id} className="border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-2 bg-slate-50/60">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {search.query?.trim() || "Saved search"}
                                            </p>
                                            <p className="text-tiny text-slate-500 truncate mt-0.5">
                                                {typeof search.priceMin === "number" || typeof search.priceMax === "number"
                                                    ? `Price: ${typeof search.priceMin === "number" ? `₹${search.priceMin}` : "Any"} - ${typeof search.priceMax === "number" ? `₹${search.priceMax}` : "Any"}`
                                                    : "Price: Any"}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                                            onClick={() => handleDeleteSavedSearch(search.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PageSection>

            {/* Dedicated Creation / Edit Modal */}
            <CreateSmartAlertDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                formData={smartAlertForm}
                updateFormData={updateSmartAlertForm}
                onSubmit={handleSubmitForm}
                onCancel={() => {
                    resetAlertForm();
                    setIsDialogOpen(false);
                }}
                isEditing={isEditing}
                errors={smartAlertErrors}
                globalError={smartAlertGlobalError}
            />
        </div>
    );
}
