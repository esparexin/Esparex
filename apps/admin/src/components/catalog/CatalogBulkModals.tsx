"use client";

import { AlertCircle, Loader2 } from "@esparex/ui";
import { CatalogModal } from "./CatalogModal";

interface CatalogBulkRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    rejectionReason: string;
    onRejectionReasonChange: (val: string) => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export function CatalogBulkRejectModal({
    isOpen,
    onClose,
    selectedCount,
    rejectionReason,
    onRejectionReasonChange,
    onConfirm,
    isSubmitting,
}: CatalogBulkRejectModalProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isSubmitting && onClose()}
            title="Bulk Reject Requests"
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                    <div>
                        <p className="text-sm font-semibold text-orange-700">Bulk Rejection Action</p>
                        <p className="mt-1 text-sm text-orange-600">
                            You are about to reject <strong>{selectedCount}</strong> selected requests. Please provide a reason to notify the submitters.
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary">Rejection Reason</label>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => onRejectionReasonChange(e.target.value)}
                        placeholder="Explain why these requests are being rejected"
                        className="w-full min-h-[100px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting || !rejectionReason.trim()}
                        onClick={onConfirm}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Reject Selected"}
                    </button>
                </div>
            </div>
        </CatalogModal>
    );
}

interface CatalogBulkDuplicateModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestType: string;
    selectedCount: number;
    searchQuery: string;
    onSearchQueryChange: (val: string) => void;
    searching: boolean;
    searchResults: Array<{ id: string; name: string }>;
    selectedTargetId: string | null;
    onSelectTarget: (id: string) => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

export function CatalogBulkDuplicateModal({
    isOpen,
    onClose,
    requestType,
    selectedCount,
    searchQuery,
    onSearchQueryChange,
    searching,
    searchResults,
    selectedTargetId,
    onSelectTarget,
    onConfirm,
    isSubmitting,
}: CatalogBulkDuplicateModalProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isSubmitting && onClose()}
            title="Bulk Mark As Duplicate"
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <div>
                        <p className="text-sm font-semibold text-blue-700">Bulk Mark As Duplicate</p>
                        <p className="mt-1 text-sm text-blue-600">
                            Select the canonical {requestType === "brand" ? "brand" : "model"} that these <strong>{selectedCount}</strong> requests are duplicates of.
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground-tertiary">
                        Search Canonical {requestType === "brand" ? "Brand" : "Model"}
                    </label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        placeholder={`Type at least 2 characters to search ${requestType === "brand" ? "brands" : "models"}`}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                {searching && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}
                <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar">
                    {searchResults.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectTarget(item.id)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-lg border transition-all ${
                                selectedTargetId === item.id
                                    ? "bg-primary/10 border-primary text-primary font-bold animate-pulse"
                                    : "bg-slate-50 border-slate-200 text-foreground-secondary hover:bg-slate-100"
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                    {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                        <p className="text-center text-xs text-foreground-subtle">No results found</p>
                    )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting || !selectedTargetId}
                        onClick={onConfirm}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                        {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Mark Selected"}
                    </button>
                </div>
            </div>
        </CatalogModal>
    );
}
