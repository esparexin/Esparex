"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Bell,
    Button,
    Crown,
    Edit2,
    Compass,
    ExternalLink,
    ImageOff,
    Plus,
    Pagination,
    Trash2,
    Power,
    MapPin,
    Tag,
    Calendar,
} from "@esparex/ui";
import { formatDate, formatPrice } from "@/lib/formatters";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type { SmartAlertFieldErrors, SmartAlertFormData, SmartAlertListItem } from "../types";
import { CreateSmartAlertDialog } from "../dialogs/CreateSmartAlertDialog";
import { SavedSearchesListSection } from "./SavedSearchesListSection";
import type { Location } from "@/lib/api/user/locations";
import { useSmartAlertModal } from "@/context/SmartAlertModalContext";
import { useSmartAlertMatches } from "@/hooks/useSmartAlertMatches";
import type { SmartAlertQuotaDTO } from "@esparex/contracts";

type SmartAlertSelection = Pick<Location, "id" | "locationId" | "name" | "display" | "city" | "coordinates">;

interface SmartAlertsTabProps {
    smartAlerts: SmartAlertListItem[];
    savedSearches: SavedSearch[];
    smartAlertForm: SmartAlertFormData;
    updateSmartAlertForm: (updates: Partial<SmartAlertFormData>) => void;
    handleCreateAlert: (location: SmartAlertSelection | null) => Promise<{ success: boolean; error?: string } | void>;
    handleToggleAlertStatus: (id: string) => void;
    handleDeleteAlert: (id: string) => void;
    handleDeleteSavedSearch: (id: string) => void;
    handleEditAlert: (alert: SmartAlertListItem) => void;
    editingAlertId: string | null;
    resetAlertForm: () => void;
    setActiveTab: (tab: string) => void;
    userPlan?: string;
    loading?: boolean;
    quota?: SmartAlertQuotaDTO | null;
    smartAlertErrors?: SmartAlertFieldErrors;
    smartAlertGlobalError?: string | null;
    clearSmartAlertError?: (field: keyof SmartAlertFieldErrors) => void;
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

export function SmartAlertsTab({
    smartAlerts, savedSearches, smartAlertForm, updateSmartAlertForm,
    handleCreateAlert, handleToggleAlertStatus, handleDeleteAlert,
    handleDeleteSavedSearch, handleEditAlert,
    editingAlertId, resetAlertForm, setActiveTab, userPlan = "Free",
    loading, quota, smartAlertErrors, smartAlertGlobalError,
}: SmartAlertsTabProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { registerTabHandler, isSmartAlertOpen, closeSmartAlertModal } = useSmartAlertModal();
    const isCreateAction = searchParams?.get("action") === "create";
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    const isDialogOpen = isInternalOpen || isCreateAction;
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Sub-tab navigation: "rules" vs "matches"
    const [activeSubTab, setActiveSubTab] = useState<"rules" | "matches">("rules");
    const [selectedAlertFilter, setSelectedAlertFilter] = useState<string | undefined>(undefined);
    const [matchesPage, setMatchesPage] = useState<number>(1);

    const {
        data: matchesData,
        isLoading: isLoadingMatches,
    } = useSmartAlertMatches({
        page: matchesPage,
        limit: 4,
        alertId: selectedAlertFilter,
    });

    // Register tab handler with global modal context so that FAB clicks on this page
    // delegate to this tab's instance instead of spawning a duplicate modal.
    useEffect(() => {
        registerTabHandler(() => { resetAlertForm(); setIsInternalOpen(true); });
        return () => registerTabHandler(null);
    }, [registerTabHandler, resetAlertForm]);

    // Ensure global context modal is closed if tab modal becomes active
    useEffect(() => {
        if (isDialogOpen && isSmartAlertOpen) closeSmartAlertModal();
    }, [isDialogOpen, isSmartAlertOpen, closeSmartAlertModal]);

    const activeAlerts = smartAlerts.filter((alert) => alert.active !== false).length;
    const isEditing = Boolean(editingAlertId);
    const isPremium = userPlan.toLowerCase() !== "free";
    const freeSlotsLimit = quota?.limit ?? 5;
    const remainingSlots = quota ? quota.remaining : Math.max(0, freeSlotsLimit - smartAlerts.length);
    const renewalText = quota?.resetsAt
        ? ` · Renews ${new Date(quota.resetsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : "";

    const handleCloseDialog = () => {
        setIsInternalOpen(false);
        if (isCreateAction) {
            router.replace("/account/alerts", { scroll: false });
        }
    };

    const handleOpenCreateModal = () => { resetAlertForm(); setIsInternalOpen(true); };
    const handleOpenEditModal = (alert: SmartAlertListItem) => { handleEditAlert(alert); setIsInternalOpen(true); };

    const handleSubmitForm = async (location: SmartAlertSelection | null) => {
        const res = await handleCreateAlert(location);
        if (res?.success) {
            handleCloseDialog();
        }
    };

    const handleViewMatchesForAlert = (alert: SmartAlertListItem) => {
        setSelectedAlertFilter(alert.id);
        setMatchesPage(1);
        setActiveSubTab("matches");
    };

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading Alerts...</div>;

    return (
        <div className="w-full max-w-3xl space-y-5">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-body-lg sm:text-heading-sm font-bold text-foreground">Smart Alerts</h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            {activeAlerts} Active
                        </span>
                    </div>
                    <p className="text-caption text-foreground-secondary mt-0.5">
                        {isPremium
                            ? "Unlimited watchdog alert slots available on your plan."
                            : `${remainingSlots} of ${freeSlotsLimit} free alert slots remaining${renewalText}.`
                        }
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={handleOpenCreateModal}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption h-9 px-4 rounded-xl shadow-xs gap-1.5 shrink-0 self-start sm:self-auto whitespace-nowrap"
                >
                    <Plus className="h-4 w-4" />
                    Create Smart Alert
                </Button>
            </div>

            {/* Clean Underline Sub-Tabs (Esparex Design System SSOT) */}
            <div className="flex gap-6 border-b border-border overflow-x-auto no-scrollbar" role="tablist" aria-label="Smart alert views">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubTab === "rules"}
                    onClick={() => setActiveSubTab("rules")}
                    className={`flex items-center gap-2 pb-3 text-caption sm:text-body font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap cursor-pointer ${
                        activeSubTab === "rules"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground-secondary hover:text-foreground"
                    }`}
                >
                    <Bell className="h-4 w-4" />
                    <span>Alert Rules ({smartAlerts.length})</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubTab === "matches"}
                    onClick={() => { setActiveSubTab("matches"); setMatchesPage(1); }}
                    className={`flex items-center gap-2 pb-3 text-caption sm:text-body font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap cursor-pointer ${
                        activeSubTab === "matches"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground-secondary hover:text-foreground"
                    }`}
                >
                    <Compass className="h-4 w-4" />
                    <span>Matched Listings ({matchesData?.total ?? 0})</span>
                </button>
            </div>

            {/* Sub-Tab 1: Alert Rules */}
            {activeSubTab === "rules" && (
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
                            onClick={() => setActiveTab("plans")}
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
            )}

            {/* Sub-Tab 2: Matched Listings */}
            {activeSubTab === "matches" && (
                <div className="space-y-4">
                    {selectedAlertFilter && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-caption">
                            <span className="text-foreground">
                                Filtered by: <strong className="text-foreground">{smartAlerts.find((a) => a.id === selectedAlertFilter)?.name || "Selected Alert"}</strong>
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-tiny text-primary hover:bg-primary/10 font-medium"
                                onClick={() => {
                                    setSelectedAlertFilter(undefined);
                                    setMatchesPage(1);
                                }}
                            >
                                Clear Filter
                            </Button>
                        </div>
                    )}

                    {isLoadingMatches ? (
                        <div className="rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border overflow-hidden">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 animate-pulse h-20" />
                            ))}
                        </div>
                    ) : !matchesData?.matches || matchesData.matches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                                <Compass className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-body text-foreground">No matched listings yet</h4>
                                <p className="text-caption text-foreground-secondary max-w-sm mx-auto mt-1">
                                    {selectedAlertFilter
                                        ? "No listings have matched this alert yet. As soon as a seller posts a matching ad, it will show up here."
                                        : "When new ads matching your alert criteria are published, they will appear here automatically."}
                                </p>
                            </div>
                            {selectedAlertFilter && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-caption font-semibold rounded-xl"
                                    onClick={() => {
                                        setSelectedAlertFilter(undefined);
                                        setMatchesPage(1);
                                    }}
                                >
                                    View All Matches
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border overflow-hidden">
                                {matchesData.matches.map((match) => {
                                    const ad = match.ad;
                                    const isSold = ad?.status === "sold";
                                    const isUnavailable = !ad || ad.status === "inactive" || ad.status === "removed" || ad.status === "deleted";
                                    const targetUrl = match.actionUrl || (match.adId ? `/ads/${match.adId}` : "#");

                                    return (
                                        <div
                                            key={match.id}
                                            className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
                                        >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/60 flex items-center justify-center">
                                                    {ad?.images?.[0] ? (
                                                        <img
                                                            src={ad.images[0]}
                                                            alt={ad.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageOff className="h-6 w-6 text-foreground-subtle" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                            <Bell className="h-2.5 w-2.5" />
                                                            {match.alertName}
                                                        </span>
                                                        {isSold ? (
                                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                                Sold
                                                            </span>
                                                        ) : isUnavailable ? (
                                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold bg-muted text-foreground-secondary border border-border shrink-0">
                                                                Listing Removed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                                Active
                                                            </span>
                                                        )}
                                                        <span className="text-tiny text-foreground-secondary flex items-center gap-1 ml-auto shrink-0">
                                                            <Calendar className="h-2.5 w-2.5" />
                                                            {formatDate(match.deliveredAt)}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-foreground text-caption sm:text-body truncate">
                                                        {ad ? ad.title : "Listing no longer available"}
                                                    </h4>

                                                    {ad && (
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption font-semibold text-foreground">
                                                            <span>{formatPrice(ad.price)}</span>
                                                            <span className="text-border hidden sm:inline">•</span>
                                                            <span className="text-tiny font-normal text-foreground-secondary flex items-center gap-0.5 truncate">
                                                                <MapPin className="h-3 w-3 text-foreground-subtle shrink-0" />
                                                                {ad.location?.display || ad.location?.city || "Location on listing"}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {ad && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-8 px-3 text-caption font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 self-start sm:self-center whitespace-nowrap"
                                                    onClick={() => router.push(targetUrl)}
                                                >
                                                    View Listing <ExternalLink className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <Pagination
                                currentPage={matchesData.page}
                                totalPages={matchesData.totalPages}
                                totalItems={matchesData.total}
                                pageSize={4}
                                onPageChange={(p) => setMatchesPage(p)}
                                itemLabel="matches"
                                alwaysShow={false}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Dedicated Creation / Edit Modal */}
            <CreateSmartAlertDialog
                open={isDialogOpen}
                onOpenChange={(nextOpen) => { if (!nextOpen) handleCloseDialog(); else setIsInternalOpen(true); }}
                formData={smartAlertForm}
                updateFormData={updateSmartAlertForm}
                onSubmit={handleSubmitForm}
                onCancel={() => {
                    resetAlertForm();
                    handleCloseDialog();
                }}
                isEditing={isEditing}
                errors={smartAlertErrors}
                globalError={smartAlertGlobalError}
            />
        </div>
    );
}
