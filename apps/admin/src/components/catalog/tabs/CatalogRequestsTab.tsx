"use client";

import { useAdminCatalogRequests } from "@/hooks/useAdminCatalogRequests";
import { type CatalogRequestItem } from "@/lib/api/catalogRequests";
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { useState } from "react";
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

    const confirmReject = async () => {
        if (!rejectingRequest || !rejectionReason.trim()) return;
        setIsRejecting(true);
        await handleReject(rejectingRequest.id, rejectionReason.trim());
        setIsRejecting(false);
        setRejectingRequest(null);
        setRejectionReason("");
    };

    return (
        <>
            <CatalogPageTemplate<CatalogRequestItem, any>
                isNested={true}
                title="Catalog Requests"
                description="Manage user-submitted requests for new brands, models, or categories. Reviewing and approving these maintains the SSOT integrity."
                createLabel="" // No manual creation of requests in admin
                csvFileName="catalog-requests.csv"
                items={requests}
                loading={loading}
                error={error}
                pagination={pagination}
                setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
                handleCreate={async () => false}
                handleUpdate={async () => false}
                defaultFormData={{}}
                formRenderer={() => null}
                generateColumns={() => [
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
        </>
    );
}
