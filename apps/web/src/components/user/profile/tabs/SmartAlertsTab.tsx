"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Plus } from "@esparex/ui";
import type { SavedSearch } from "@/lib/api/user/savedSearches";
import type { SmartAlertFieldErrors, SmartAlertFormData, SmartAlertListItem } from "../types";
import { CreateSmartAlertDialog } from "../dialogs/CreateSmartAlertDialog";
import type { Location } from "@/lib/api/user/locations";
import { useSmartAlertModal } from "@/context/SmartAlertModalContext";
import { useSmartAlertMatches } from "@/hooks/useSmartAlertMatches";
import type { SmartAlertQuotaDTO } from "@esparex/contracts";
import { SmartAlertRulesSection } from "./SmartAlertRulesSection";
import { SmartAlertMatchesSection } from "./SmartAlertMatchesSection";

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

export function SmartAlertsTab({
    smartAlerts,
    savedSearches,
    smartAlertForm,
    updateSmartAlertForm,
    handleCreateAlert,
    handleToggleAlertStatus,
    handleDeleteAlert,
    handleDeleteSavedSearch,
    handleEditAlert,
    editingAlertId,
    resetAlertForm,
    setActiveTab,
    userPlan: _userPlan = "Free",
    loading,
    quota,
    smartAlertErrors,
    smartAlertGlobalError,
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

    // Register tab handler with global modal context
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
            <div className="flex items-center justify-between gap-3 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <h3 className="text-body-lg sm:text-h4 font-semibold text-foreground">Smart Alerts</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        {activeAlerts} Active
                    </span>
                </div>

                <Button
                    type="button"
                    onClick={handleOpenCreateModal}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption h-9 px-3 sm:px-4 rounded-xl shadow-xs gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create Alert</span>
                </Button>
            </div>

            {/* Clean Underline Sub-Tabs (Esparex Design System SSOT) */}
            <div className="flex gap-6 border-b border-border overflow-x-auto no-scrollbar" role="tablist" aria-label="Smart alert views">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubTab === "rules"}
                    onClick={() => setActiveSubTab("rules")}
                    className={`pb-3 text-body font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        activeSubTab === "rules"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground-secondary hover:text-foreground"
                    }`}
                >
                    <span>Alert Rules ({smartAlerts.length})</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubTab === "matches"}
                    onClick={() => { setActiveSubTab("matches"); setMatchesPage(1); }}
                    className={`pb-3 text-body font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        activeSubTab === "matches"
                            ? "border-primary text-primary"
                            : "border-transparent text-foreground-secondary hover:text-foreground"
                    }`}
                >
                    <span>Matched Listings ({matchesData?.total ?? 0})</span>
                </button>
            </div>

            {/* Sub-Tab 1: Alert Rules */}
            {activeSubTab === "rules" && (
                <SmartAlertRulesSection
                    smartAlerts={smartAlerts}
                    savedSearches={savedSearches}
                    pendingDeleteId={pendingDeleteId}
                    setPendingDeleteId={setPendingDeleteId}
                    handleOpenCreateModal={handleOpenCreateModal}
                    handleOpenEditModal={handleOpenEditModal}
                    handleToggleAlertStatus={handleToggleAlertStatus}
                    handleDeleteAlert={handleDeleteAlert}
                    handleDeleteSavedSearch={handleDeleteSavedSearch}
                    handleViewMatchesForAlert={handleViewMatchesForAlert}
                    setActiveTab={setActiveTab}
                    quota={quota}
                />
            )}

            {/* Sub-Tab 2: Matched Listings */}
            {activeSubTab === "matches" && (
                <SmartAlertMatchesSection
                    smartAlerts={smartAlerts}
                    selectedAlertFilter={selectedAlertFilter}
                    onClearFilter={() => {
                        setSelectedAlertFilter(undefined);
                        setMatchesPage(1);
                    }}
                    isLoadingMatches={isLoadingMatches}
                    matchesData={matchesData}
                    onPageChange={(p) => setMatchesPage(p)}
                    onNavigateToAd={(url) => router.push(url)}
                />
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
