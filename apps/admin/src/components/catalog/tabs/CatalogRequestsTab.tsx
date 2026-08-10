"use client";

import { useAdminCatalogRequests } from "@/hooks/useAdminCatalogRequests";
import { type CatalogRequestItem } from "@/lib/api/catalogRequests";
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from "@esparex/ui";
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
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { CatalogBulkRejectModal, CatalogBulkDuplicateModal } from "@/components/catalog/CatalogBulkModals";

const REQUEST_STATUS_VALUES = new Set(["all", "pending", "approved", "rejected", "duplicate", "resolved"]);

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
                showAdminPopup({
                    type: "error",
                    title: "Search Failed",
                    message: e instanceof Error ? e.message : "Unable to complete catalog search.",
                });
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
            showAdminPopup({
                type: "error",
                title: "Bulk Reject Failed",
                message: e instanceof Error ? e.message : "Unable to reject selected requests.",
            });
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
            showAdminPopup({
                type: "error",
                title: "Mark Duplicate Failed",
                message: e instanceof Error ? e.message : "Unable to mark selected requests as duplicate.",
            });
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
                defaultFormData={{} as Record<string, never>}
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
                                 <div className="flex flex-col gap-1">
                                     <CatalogEntityCell
                                         icon={<ClipboardList size={20} />}
                                         iconClassName="bg-amber-50 text-amber-600"
                                         title={req.requestedName}
                                         subtitle={`${req.requestType} • ${userName}`}
                                     />
                                     {req.listingId && (
                                         <a
                                             href={`/listing/${req.listingId}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="inline-flex items-center gap-1 ml-10 text-tiny font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                         >
                                             <ExternalLink size={10} />
                                             View Listing
                                         </a>
                                     )}
                                 </div>
                             );
                         },
                     },
                    {
                        header: "Status",
                        cell: (req) => (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-tiny font-bold uppercase tracking-wider ${
                                req.status === "approved" || req.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                                req.status === "rejected" ? "bg-red-100 text-red-700" :
                                req.status === "duplicate" ? "bg-blue-100 text-blue-700" :
                                "bg-amber-100 text-amber-700"
                            }`}>
                                {req.status === "pending" ? <Clock size={10} /> : (req.status === "approved" || req.status === "resolved") ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                {req.status}
                            </span>
                        ),
                    },
                    {
                        header: "Demand",
                        cell: (req) => {
                            const count = req.requestCount ?? 1;
                            const isHot = count >= 5;
                            return (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-tiny font-bold ${
                                    isHot
                                        ? "bg-rose-100 text-rose-700"
                                        : count >= 2
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-foreground-tertiary"
                                }`}>
                                    ×{count}
                                </span>
                            );
                        },
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
                                { value: "resolved", label: "Resolved" },
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

            <CatalogBulkRejectModal
                isOpen={bulkRejectOpen}
                onClose={() => setBulkRejectOpen(false)}
                selectedCount={selectedIds.length}
                rejectionReason={bulkRejectionReason}
                onRejectionReasonChange={setBulkRejectionReason}
                onConfirm={confirmBulkReject}
                isSubmitting={isBulkRejecting}
            />

            <CatalogBulkDuplicateModal
                isOpen={bulkDuplicateOpen}
                onClose={() => setBulkDuplicateOpen(false)}
                requestType={requestType}
                selectedCount={selectedIds.length}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searching={searching}
                searchResults={searchResults}
                selectedTargetId={selectedTargetId}
                onSelectTarget={setSelectedTargetId}
                onConfirm={confirmBulkDuplicate}
                isSubmitting={isBulkDuplicating}
            />
        </>
    );
}
