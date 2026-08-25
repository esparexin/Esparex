"use client";

import { useState } from "react";
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

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Alerts...</div>;

    return (
        <div className="space-y-4 w-full">
            <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <CardContent className="p-4 sm:p-5 space-y-4">
                    {/* Header & Create Action with Clear Top Left Balance Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-body-lg font-bold text-foreground tracking-tight">Smart Alerts</h3>
                                </div>
                                <p className="text-caption text-foreground-subtle truncate mt-0.5">
                                    Get instant notifications when new listings match your criteria.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                        {activeAlerts} Active Alert{activeAlerts === 1 ? "" : "s"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-muted text-foreground-secondary border border-border">
                                        <Eye className="h-3 w-3 text-foreground-subtle" />
                                        {savedSearches.length} Saved Search{savedSearches.length === 1 ? "" : "es"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleOpenCreateModal}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption h-9 rounded-xl shadow-xs gap-1.5 shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Create Smart Alert
                        </Button>
                    </div>

                    {/* Active Alerts Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-body font-bold text-foreground">Your Active Alerts</h4>
                            <span className="text-caption font-medium text-foreground-subtle">{smartAlerts.length} total</span>
                        </div>

                        {smartAlerts.length === 0 ? (
                            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-dashed border-border">
                                <Bell className="h-5 w-5 text-foreground-subtle shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-caption font-bold text-foreground">No smart alerts set up yet</p>
                                    <p className="text-tiny text-foreground-subtle truncate">Create an alert using the button above to get notified automatically.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {smartAlerts.map((alert) => (
                                    <div key={alert.id} className="border border-border rounded-xl p-3.5 space-y-3 bg-card shadow-2xs hover:border-primary/30 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-foreground text-caption sm:text-body tracking-tight truncate">{alert.name}</h4>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-tiny font-semibold ${
                                                            alert.active === false
                                                                ? "bg-muted text-foreground-secondary"
                                                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        }`}
                                                    >
                                                        {alert.active === false ? "Paused" : "Active"}
                                                    </Badge>
                                                </div>
                                                {alert.keywords && (
                                                    <p className="text-caption text-foreground-secondary font-medium">
                                                        Keywords: <span className="text-foreground font-semibold">{alert.keywords}</span>
                                                    </p>
                                                )}
                                                <p className="text-tiny text-foreground-subtle mt-0.5">
                                                    Category: {alert.category || "All"} • Location: {alert.location || "Any"} {alert.radiusKm ? `(${alert.radiusKm} km)` : ""}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <Button variant="outline" size="sm" className="gap-1.5 text-caption font-semibold h-8 rounded-lg border-border text-foreground-secondary hover:bg-muted" onClick={() => handleViewAlertMatches(alert)}>
                                                <Eye className="h-3.5 w-3.5 text-foreground-subtle" /> View Ads
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1.5 text-caption font-semibold h-8 rounded-lg border-border text-foreground-secondary hover:bg-muted" onClick={() => handleOpenEditModal(alert)}>
                                                <Edit2 className="h-3.5 w-3.5 text-foreground-subtle" /> Edit
                                            </Button>
                                            <Button variant="outline" size="sm" className="gap-1.5 text-caption font-semibold h-8 rounded-lg border-border text-foreground-secondary hover:bg-muted" onClick={() => handleToggleAlertStatus(alert.id)}>
                                                <Bell className="h-3.5 w-3.5 text-foreground-subtle" /> {alert.active === false ? "Resume" : "Pause"}
                                            </Button>
                                            {pendingDeleteId === alert.id ? (
                                                <Button variant="outline" size="sm" className="gap-1.5 text-caption font-semibold h-8 rounded-lg text-destructive border-destructive/20 bg-destructive/10 hover:bg-destructive/20" onClick={() => { setPendingDeleteId(null); handleDeleteAlert(alert.id); }}>
                                                    <Trash2 className="h-3.5 w-3.5" /> Confirm
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" className="gap-1.5 text-caption font-semibold h-8 rounded-lg text-destructive hover:bg-destructive/10 border-border" onClick={() => setPendingDeleteId(alert.id)}>
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upgrade Micro-Banner */}
                    <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Crown className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-caption text-purple-950">Want more smart alerts?</h4>
                            <p className="text-tiny text-purple-700/90 truncate">Upgrade your plan to unlock more alert slots.</p>
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-caption h-8 px-3 rounded-lg shrink-0 shadow-xs" onClick={() => setActiveTab("plans")}>
                            Upgrade
                        </Button>
                    </div>

                    <Separator className="my-1" />

                    {/* Saved Searches Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-body font-bold text-foreground">Saved Searches</h4>
                            <span className="text-caption font-medium text-foreground-subtle">{savedSearches.length} saved</span>
                        </div>
                        {savedSearches.length === 0 ? (
                            <p className="text-caption text-foreground-subtle">No saved searches yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {savedSearches.map((search) => (
                                    <div key={search.id} className="border border-border rounded-xl p-2.5 flex items-center justify-between gap-2 bg-muted/30">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-caption font-bold text-foreground truncate">
                                                {search.query?.trim() || "Saved search"}
                                            </p>
                                            <p className="text-tiny text-foreground-subtle truncate mt-0.5">
                                                {typeof search.priceMin === "number" || typeof search.priceMax === "number"
                                                    ? `Price: ${typeof search.priceMin === "number" ? `₹${search.priceMin}` : "Any"} - ${typeof search.priceMax === "number" ? `₹${search.priceMax}` : "Any"}`
                                                    : "Price: Any"}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10 rounded-lg text-caption" onClick={() => handleDeleteSavedSearch(search.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

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
