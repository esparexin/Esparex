"use client";

import {
    Bell,
    Button,
    Calendar,
    Compass,
    Crown,
    Edit2,
    MapPin,
    Plus,
    Power,
    Tag,
    Trash2,
} from "@esparex/ui";
import { formatDate } from "@/lib/formatters";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type { SmartAlertListItem } from "../types";
import { SavedSearchesListSection } from "./SavedSearchesListSection";

export interface SmartAlertRulesSectionProps {
    smartAlerts: SmartAlertListItem[];
    savedSearches: SavedSearch[];
    pendingDeleteId: string | null;
    setPendingDeleteId: (id: string | null) => void;
    handleOpenCreateModal: () => void;
    handleOpenEditModal: (alert: SmartAlertListItem) => void;
    handleToggleAlertStatus: (id: string) => void;
    handleDeleteAlert: (id: string) => void;
    handleDeleteSavedSearch: (id: string) => void;
    handleViewMatchesForAlert: (alert: SmartAlertListItem) => void;
    setActiveTab: (tab: string) => void;
}

function formatAlertLocation(location?: string, radiusKm?: number, alertName?: string): string {
    const isUnknown = !location || location === "Unknown Location" || location.trim() === "";
    if (isUnknown) {
        if (alertName) {
            const firstWord = alertName.split(" ")[0];
            if (firstWord && !["smart", "all", "phone", "car", "service", "spare"].includes(firstWord.toLowerCase())) {
                return radiusKm ? `${firstWord} (${radiusKm} km)` : firstWord;
            }
        }
        return radiusKm ? `Within ${radiusKm} km` : "Any location";
    }
    return radiusKm ? `${location} (${radiusKm} km)` : location;
}

export function SmartAlertRulesSection({
    smartAlerts,
    savedSearches,
    pendingDeleteId,
    setPendingDeleteId,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleToggleAlertStatus,
    handleDeleteAlert,
    handleDeleteSavedSearch,
    handleViewMatchesForAlert,
    setActiveTab,
}: SmartAlertRulesSectionProps) {
    return (
        <div className="space-y-5">
            {smartAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                        <Bell className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-body text-foreground">No smart alerts created yet</h4>
                        <p className="text-caption text-foreground-secondary max-w-sm mx-auto mt-1">
                            Set up watchdogs for specific models, categories, and price ranges to get notified immediately when matching items are posted.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={handleOpenCreateModal}
                        size="sm"
                        className="bg-primary text-primary-foreground font-semibold text-caption h-9 px-4 rounded-xl gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> Create Your First Alert
                    </Button>
                </div>
            ) : (
                <div className="rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border overflow-hidden">
                    {smartAlerts.map((alert) => {
                        const formattedLoc = formatAlertLocation(alert.location, alert.radiusKm, alert.name);
                        const isPaused = alert.active === false;

                        return (
                            <div
                                key={alert.id}
                                className="p-4 hover:bg-muted/30 transition-colors space-y-2.5"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isPaused ? "bg-muted-foreground" : "bg-emerald-500 animate-pulse"}`} />
                                        <h4 className="font-bold text-foreground text-caption sm:text-body truncate">
                                            {alert.name}
                                        </h4>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold border shrink-0 ${isPaused ? "bg-muted text-foreground-secondary border-border" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                            {isPaused ? "Paused" : "Active"}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2.5 text-caption font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 whitespace-nowrap"
                                            onClick={() => handleViewMatchesForAlert(alert)}
                                            title="View delivered matched listings for this alert"
                                            aria-label={`View matching listings for ${alert.name}`}
                                        >
                                            <Compass className="h-3.5 w-3.5" aria-hidden="true" /> View Matches
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-caption font-medium rounded-lg text-foreground-secondary hover:text-foreground"
                                            onClick={() => handleOpenEditModal(alert)}
                                            title="Edit Alert"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-caption font-medium rounded-lg text-foreground-secondary hover:text-foreground"
                                            onClick={() => handleToggleAlertStatus(alert.id)}
                                            title={isPaused ? "Resume Alert" : "Pause Alert"}
                                        >
                                            <Power className={`h-3.5 w-3.5 ${isPaused ? "text-emerald-600" : "text-amber-600"}`} />
                                        </Button>
                                        {pendingDeleteId === alert.id ? (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 px-2.5 text-tiny font-semibold rounded-lg"
                                                onClick={() => { setPendingDeleteId(null); handleDeleteAlert(alert.id); }}
                                            >
                                                Confirm
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-caption font-medium rounded-lg text-destructive hover:bg-destructive/10"
                                                onClick={() => setPendingDeleteId(alert.id)}
                                                title="Delete Alert"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Criteria Details */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-tiny text-foreground-secondary">
                                    <div className="flex items-center gap-1">
                                        <Tag className="h-3 w-3 text-foreground-subtle shrink-0" />
                                        <span>{alert.category || "All Categories"}</span>
                                    </div>
                                    <span className="text-border hidden sm:inline">•</span>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-foreground-subtle shrink-0" />
                                        <span>{formattedLoc}</span>
                                    </div>
                                    {alert.keywords && (
                                        <>
                                            <span className="text-border hidden sm:inline">•</span>
                                            <span className="truncate">Keywords: <strong className="text-foreground">{alert.keywords}</strong></span>
                                        </>
                                    )}
                                    {alert.createdAt && (
                                        <>
                                            <span className="text-border hidden sm:inline">•</span>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-foreground-subtle shrink-0" />
                                                <span>Created {formatDate(alert.createdAt)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Clean Upgrade Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Crown className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-semibold text-caption sm:text-body text-foreground">Want more smart alerts?</h4>
                        <p className="text-caption text-foreground-secondary truncate">Upgrade your plan to unlock additional alert slots.</p>
                    </div>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10 font-semibold text-caption h-8 px-3 rounded-lg shrink-0 whitespace-nowrap"
                    onClick={() => setActiveTab("buyplans")}
                >
                    Upgrade
                </Button>
            </div>

            {/* Saved Searches Section */}
            <div className="pt-2">
                <SavedSearchesListSection
                    savedSearches={savedSearches}
                    handleDeleteSavedSearch={handleDeleteSavedSearch}
                />
            </div>
        </div>
    );
}
