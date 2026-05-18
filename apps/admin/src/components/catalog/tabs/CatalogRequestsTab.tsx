"use client";

import { useAdminCatalogRequests } from "@/hooks/useAdminCatalogRequests";
import { type CatalogRequestItem } from "@/lib/api/catalogRequests";
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useState, useEffect } from "react";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import {
    CatalogActionsRow,
    CatalogActionIconButton,
    CatalogEntityCell,
    CatalogSelectFilter,
    CatalogRejectSuggestionForm,
    CatalogSearchInput,
} from "@/components/catalog/CatalogUiPrimitives";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { useSearchParams } from "next/navigation";
import { getBrands } from "@/lib/api/brands";
import { getModels } from "@/lib/api/models";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

const REQUEST_STATUS_VALUES = new Set(["all", "pending", "approved", "rejected", "duplicate"]);

const normalizeRequestStatusParam = (value: string | null) =>
    value && REQUEST_STATUS_VALUES.has(value) ? value : "all";

export default function CatalogRequestsTab() {
    const searchParams = useSearchParams();
    const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
    const initialStatus = normalizeRequestStatusParam(searchParams.get("status"));
    const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

    const [searchInput, setSearchInput] = useState(initialSearch);

    const {
        requests,
        loading,
        error,
        handleApprove,
        handleReject,
        handleBulkReject,
        handleBulkMarkDuplicate,
        pagination,
    } = useAdminCatalogRequests({
        initialFilters: {
            search: initialSearch,
            status: initialStatus,
        },
        initialPagination: {
            page: initialPage,
            limit: 20,
        },
    });

    const { replaceQueryState } = useCatalogQueryStateSync({
        searchInput,
        initialSearch,
        loading,
        initialPage,
        totalPages: pagination.totalPages,
    });

    const [rejectingRequest, setRejectingRequest] = useState<CatalogRequestItem | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Bulk Reject state
    const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
    const [bulkRejectionReason, setBulkRejectionReason] = useState("");
    const [isBulkRejecting, setIsBulkRejecting] = useState(false);
    
    // Bulk Duplicate state
    const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
    const [searching, setSearching] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isBulkDuplicating, setIsBulkDuplicating] = useState(false);

    // Determine request type of selection to guide the duplicate catalog search
    const firstSelectedId = selectedIds[0];
    const firstSelectedRequest = requests.find((r) => r.id === firstSelectedId);
    const requestType = firstSelectedRequest?.requestType || "brand";

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const performSearch = async () => {
            setSearching(true);
            try {
                if (requestType === "brand") {
                    const res = await getBrands({ search: searchQuery });
                    const parsed = parseAdminResponse<any>(res);
                    setSearchResults(parsed.items.map((item) => ({ id: item.id, name: item.name })));
                } else {
                    const res = await getModels({ search: searchQuery });
                    const parsed = parseAdminResponse<any>(res);
                    setSearchResults(parsed.items.map((item) => ({ id: item.id, name: item.name })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        };
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, requestType]);

    const allSelected = requests.length > 0 && requests.every((item) => selectedIds.includes(item.id));
    
    const onToggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(requests.map((item) => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const onToggleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((x) => x !== id));
        }
    };

    const openBulkReject = () => {
        setBulkRejectionReason("");
        setBulkRejectOpen(true);
    };

    const openBulkDuplicate = () => {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedTargetId(null);
        setBulkDuplicateOpen(true);
    };

    const confirmReject = async () => {
        if (!rejectingRequest || !rejectionReason.trim()) return;
        setIsRejecting(true);
        await handleReject(rejectingRequest.id, rejectionReason.trim());
        setIsRejecting(false);
        setRejectingRequest(null);
        setRejectionReason("");
    };

    const confirmBulkReject = async () => {
        if (selectedIds.length === 0 || !bulkRejectionReason.trim()) return;
        setIsBulkRejecting(true);
        try {
            await handleBulkReject(selectedIds, bulkRejectionReason.trim());
            setSelectedIds([]);
            setBulkRejectOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsBulkRejecting(false);
        }
    };

    const confirmBulkDuplicate = async () => {
        if (selectedIds.length === 0 || !selectedTargetId) return;
        setIsBulkDuplicating(true);
        try {
            await handleBulkMarkDuplicate(selectedIds, selectedTargetId);
            setSelectedIds([]);
            setBulkDuplicateOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsBulkDuplicating(false);
        }
    };

    const bulkActions = (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={openBulkReject}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-all shadow-sm"
            >
                Quick Reject
            </button>
            <button
                type="button"
                onClick={openBulkDuplicate}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/95 transition-all shadow-sm"
            >
                Quick Duplicate
            </button>
        </div>
    );

    return (
        <>
            <CatalogPageTemplate<CatalogRequestItem, Record<string, never>>
                isNested={true}
                title="Catalog Requests"
                description="Manage user-submitted requests for new brands, models, or categories. Reviewing and approving these maintains the SSOT integrity."
                createLabel="" // No manual creation of requests in admin
                csvFileName="catalog-requests.csv"
                items={requests}
                loading={loading}
                error={error}
                pagination={pagination}
                selectedCount={selectedIds.length}
                bulkActions={selectedIds.length > 0 ? bulkActions : undefined}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={async () => false}
                handleUpdate={async () => false}
                defaultFormData={{}}
                formRenderer={() => null}
                generateColumns={() => [
                    {
                        header: (
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={(e) => onToggleSelectAll(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                        ),
                        id: "select",
                        className: "w-12",
                        cell: (req) => (
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(req.id)}
                                onChange={(e) => onToggleSelect(req.id, e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                        ),
                    },
                    {
                        header: "Request",
                        cell: (req) => {
                            const userName = typeof req.requestedBy === 'string' ? req.requestedBy : `${req.requestedBy.firstName} ${req.requestedBy.lastName}`;
                            return (
                                <CatalogEntityCell
                                    icon={<ClipboardList size={20} />}
                                    iconClassName="bg-amber-50 text-amber-600"
                                    title={req.requestedName}
                                    subtitle={`${req.requestType} • ${userName}`}
                                />
                            );
                        },
                    },
                    {
                        header: "Status",
                        cell: (req) => (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                req.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                                req.status === "rejected" ? "bg-red-100 text-red-700" :
                                req.status === "duplicate" ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                            }`}>
                                {req.status === "pending" ? <Clock size={10} /> : req.status === "approved" ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                {req.status}
                            </span>
                        ),
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (req) => (
                            <CatalogActionsRow>
                                {req.status === "pending" && (
                                    <>
                                        <CatalogActionIconButton
                                            onClick={() => void handleApprove(req.id)}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                            title="Approve"
                                            icon={<CheckCircle size={18} />}
                                        />
                                        <CatalogActionIconButton
                                            onClick={() => {
                                                setRejectionReason("");
                                                setRejectingRequest(req);
                                            }}
                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                            title="Reject"
                                            icon={<XCircle size={18} />}
                                        />
                                    </>
                                )}
                            </CatalogActionsRow>
                        ),
                    },
                ]}
                filterLayoutClassName="md:grid-cols-2"
                filtersRenderer={
                    <>
                        <CatalogSearchInput
                            value={searchInput}
                            placeholder="Search requests..."
                            onChange={setSearchInput}
                        />
                        <CatalogSelectFilter
                            value={initialStatus}
                            onChange={(status) =>
                                replaceQueryState({
                                    status: status !== "all" ? status : null,
                                    page: null,
                                })
                            }
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "pending", label: "Pending" },
                                { value: "approved", label: "Approved" },
                                { value: "rejected", label: "Rejected" },
                                { value: "duplicate", label: "Duplicate" },
                            ]}
                        />
                    </>
                }
            />

            <CatalogModal
                isOpen={!!rejectingRequest}
                onClose={() => !isRejecting && setRejectingRequest(null)}
                title="Reject Catalog Request"
            >
                <CatalogRejectSuggestionForm
                    itemName={rejectingRequest?.requestedName}
                    rejectionReason={rejectionReason}
                    onRejectionReasonChange={setRejectionReason}
                    onCancel={() => setRejectingRequest(null)}
                    onConfirm={() => void confirmReject()}
                    isSubmitting={isRejecting}
                    placeholder="e.g. Duplicate request, Already in catalog, Spam..."
                />
            </CatalogModal>

            {/* Bulk Reject Modal */}
            <CatalogModal
                isOpen={bulkRejectOpen}
                onClose={() => !isBulkRejecting && setBulkRejectOpen(false)}
                title="Bulk Reject Requests"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                        <div>
                            <p className="text-sm font-semibold text-orange-700">Bulk Rejection Action</p>
                            <p className="mt-1 text-sm text-orange-600">
                                You are about to reject <strong>{selectedIds.length}</strong> selected requests. Please provide a reason to notify the submitters.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rejection Reason</label>
                        <textarea
                            value={bulkRejectionReason}
                            onChange={(e) => setBulkRejectionReason(e.target.value)}
                            placeholder="Explain why these requests are being rejected"
                            className="w-full min-h-[100px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isBulkRejecting}
                            onClick={() => setBulkRejectOpen(false)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isBulkRejecting || !bulkRejectionReason.trim()}
                            onClick={confirmBulkReject}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                            {isBulkRejecting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Reject Selected"}
                        </button>
                    </div>
                </div>
            </CatalogModal>

            {/* Bulk Duplicate Modal */}
            <CatalogModal
                isOpen={bulkDuplicateOpen}
                onClose={() => !isBulkDuplicating && setBulkDuplicateOpen(false)}
                title="Bulk Mark As Duplicate"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div>
                            <p className="text-sm font-semibold text-blue-700">Bulk Mark As Duplicate</p>
                            <p className="mt-1 text-sm text-blue-600">
                                Select the canonical {requestType === 'brand' ? 'brand' : 'model'} that these <strong>{selectedIds.length}</strong> requests are duplicates of.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Search Canonical {requestType === 'brand' ? 'Brand' : 'Model'}
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Type at least 2 characters to search ${requestType === 'brand' ? 'brands' : 'models'}`}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                                onClick={() => setSelectedTargetId(item.id)}
                                className={`w-full text-left px-4 py-2 text-sm rounded-lg border transition-all ${
                                    selectedTargetId === item.id 
                                        ? "bg-primary/10 border-primary text-primary font-bold animate-pulse" 
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                            >
                                {item.name}
                            </button>
                        ))}
                        {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                            <p className="text-center text-xs text-slate-400">No results found</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isBulkDuplicating}
                            onClick={() => setBulkDuplicateOpen(false)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isBulkDuplicating || !selectedTargetId}
                            onClick={confirmBulkDuplicate}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                            {isBulkDuplicating ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Mark Selected"}
                        </button>
                    </div>
                </div>
            </CatalogModal>
        </>
    );
}
