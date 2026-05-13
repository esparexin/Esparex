"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, SearchCheck, XCircle } from 'lucide-react';
import { AdminPageShell } from '@/components/layout/AdminPageShell';
import { AdminModuleTabs } from '@/components/layout/AdminModuleTabs';
import { catalogManagementTabs } from '@/components/layout/adminModuleTabSets';
import { AdminFilterToolbar } from '@/components/layout/AdminFilterToolbar';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { StatusChip } from '@/components/ui/StatusChip';
import { useToast } from '@/context/ToastContext';
import { parseAdminResponse } from '@/lib/api/parseAdminResponse';
import {
    type CatalogRequestItem,
    type CatalogRequestStatus,
    type CatalogRequestStats,
    type CatalogRequestType,
    listAdminCatalogRequests,
    getAdminCatalogRequestById,
    approveAdminCatalogRequest,
    rejectAdminCatalogRequest,
    markAdminCatalogRequestDuplicate,
    getAdminCatalogRequestStats,
    bulkApproveAdminCatalogRequests,
    bulkRejectAdminCatalogRequests,
    bulkMarkAdminCatalogRequestsDuplicate,
} from '@/lib/api/catalogRequests';
import { getCategories } from '@/lib/api/categories';
import { getBrands } from '@/lib/api/brands';
import { extractAdminApiErrorMessage } from '@/hooks/useAdminCatalogCollection';

type StatusTab = 'all' | CatalogRequestStatus;
type TypeFilter = 'all' | CatalogRequestType;

type NameMap = Record<string, string>;

type ListPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

const STATUS_TAB_ORDER: StatusTab[] = ['all', 'pending', 'approved', 'rejected', 'duplicate'];

const statusLabel = (status: CatalogRequestStatus) => {
    if (status === 'pending') return 'Pending';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return 'Duplicate';
};

const toDisplayName = (request: CatalogRequestItem) => {
    const requestedBy = request.requestedBy;
    if (!requestedBy || typeof requestedBy === 'string') return 'User';
    const first = requestedBy.firstName?.trim() || '';
    const last = requestedBy.lastName?.trim() || '';
    const full = `${first} ${last}`.trim();
    return full || requestedBy.email || requestedBy.mobile || 'User';
};

const coerceStatusTab = (value: string | null): StatusTab => {
    if (!value) return 'pending';
    const normalized = value.toLowerCase();
    return STATUS_TAB_ORDER.includes(normalized as StatusTab)
        ? (normalized as StatusTab)
        : 'pending';
};

const coerceTypeFilter = (value: string | null): TypeFilter => {
    if (!value) return 'all';
    const normalized = value.toLowerCase();
    return normalized === 'brand' || normalized === 'model' ? normalized : 'all';
};

const coercePositiveInt = (value: string | null, fallback: number): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const asInt = Math.trunc(parsed);
    return asInt >= 1 ? asInt : fallback;
};

const normalizeSearch = (value: string | null): string => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

function CatalogRequestDetailDrawer({
    item,
    loading,
    onClose,
    onApprove,
    onReject,
    onMarkDuplicate,
    categoryName,
    parentBrandName,
    mutating,
}: {
    item: CatalogRequestItem | null;
    loading: boolean;
    onClose: () => void;
    onApprove: (adminNotes?: string) => Promise<void>;
    onReject: (rejectionReason: string, adminNotes?: string) => Promise<void>;
    onMarkDuplicate: (duplicateOfEntityId: string, adminNotes?: string) => Promise<void>;
    categoryName?: string;
    parentBrandName?: string;
    mutating: boolean;
}) {
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [duplicateOfEntityId, setDuplicateOfEntityId] = useState('');

    useEffect(() => {
        if (!item) {
            setAdminNotes('');
            setRejectionReason('');
            setDuplicateOfEntityId('');
            return;
        }

        setAdminNotes(item.adminNotes || '');
        setRejectionReason(item.rejectionReason || '');
        setDuplicateOfEntityId(item.duplicateOfEntityId || item.approvedEntityId || '');
    }, [item]);

    if (!item && !loading) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm" onClick={onClose}>
            <aside
                className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Catalog Request</p>
                            <h2 className="mt-1 text-lg font-bold text-slate-900">
                                {item ? item.requestedName : 'Loading...'}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:bg-slate-50"
                        >
                            Close
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    {loading || !item ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 size={16} className="animate-spin" /> Loading request details...
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                                <div>
                                    <p className="font-semibold uppercase tracking-[0.1em] text-slate-500">Type</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.requestType === 'brand' ? 'Brand' : 'Model'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold uppercase tracking-[0.1em] text-slate-500">Status</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{statusLabel(item.status)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="font-semibold uppercase tracking-[0.1em] text-slate-500">Category</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{categoryName || item.categoryId}</p>
                                </div>
                                {item.requestType === 'model' && (
                                    <div className="col-span-2">
                                        <p className="font-semibold uppercase tracking-[0.1em] text-slate-500">Parent Brand</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{parentBrandName || item.parentBrandId || 'N/A'}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <p className="font-semibold uppercase tracking-[0.1em] text-slate-500">Requested By</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{toDisplayName(item)}</p>
                                </div>
                            </div>

                            {item.status !== 'pending' && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                                    Request has already been reviewed. Actions are disabled.
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(event) => setAdminNotes(event.target.value)}
                                    className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="Internal review notes"
                                    disabled={item.status !== 'pending' || mutating}
                                />
                            </div>

                            {item.status === 'pending' && (
                                <>
                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Approve Request</p>
                                                <p className="text-xs text-slate-500">Creates or links canonical catalog entity and releases waiting ads.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void onApprove(adminNotes || undefined)}
                                                disabled={mutating}
                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-emerald-700 disabled:opacity-60"
                                            >
                                                {mutating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                Approve
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <p className="text-sm font-semibold text-slate-900">Mark Duplicate</p>
                                        <p className="text-xs text-slate-500">Provide existing canonical Brand/Model ID to link this request.</p>
                                        <input
                                            value={duplicateOfEntityId}
                                            onChange={(event) => setDuplicateOfEntityId(event.target.value)}
                                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Existing entity ObjectId"
                                            disabled={mutating}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void onMarkDuplicate(duplicateOfEntityId.trim(), adminNotes || undefined)}
                                            disabled={mutating || duplicateOfEntityId.trim().length === 0}
                                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-amber-700 disabled:opacity-60"
                                        >
                                            {mutating ? <Loader2 size={12} className="animate-spin" /> : <SearchCheck size={12} />}
                                            Mark Duplicate
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                                        <p className="text-sm font-semibold text-rose-900">Reject Request</p>
                                        <p className="text-xs text-rose-700">Waiting ads remain catalog-pending until user submits a valid replacement.</p>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(event) => setRejectionReason(event.target.value)}
                                            className="mt-3 min-h-[90px] w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                            placeholder="Rejection reason"
                                            disabled={mutating}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void onReject(rejectionReason.trim(), adminNotes || undefined)}
                                            disabled={mutating || rejectionReason.trim().length === 0}
                                            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-rose-700 disabled:opacity-60"
                                        >
                                            {mutating ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                            Reject
                                        </button>
                                    </div>
                                </>
                            )}

                            {item.status === 'rejected' && item.rejectionReason && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                                    <p className="font-semibold">Rejection Reason</p>
                                    <p className="mt-1 whitespace-pre-wrap">{item.rejectionReason}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default function CatalogRequestsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [items, setItems] = useState<CatalogRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [pagination, setPagination] = useState<ListPagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [stats, setStats] = useState<CatalogRequestStats | null>(null);

    const [selectedRequest, setSelectedRequest] = useState<CatalogRequestItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mutating, setMutating] = useState(false);

    const [categoryMap, setCategoryMap] = useState<NameMap>({});
    const [brandMap, setBrandMap] = useState<NameMap>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));
    const isSomeSelected = items.some(item => selectedIds.has(item.id)) && !isAllSelected;

    const status = coerceStatusTab(searchParams.get('status'));
    const requestType = coerceTypeFilter(searchParams.get('requestType'));
    const page = coercePositiveInt(searchParams.get('page'), 1);
    const q = normalizeSearch(searchParams.get('q'));

    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    const setQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                params.delete(key);
                return;
            }
            params.set(key, String(value));
        });

        const nextQuery = params.toString();
        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [pathname, router, searchParams]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalized = searchInput.trim();
            if (normalized === q) return;
            setQueryState({ q: normalized || null, page: null });
        }, 300);

        return () => window.clearTimeout(timer);
    }, [searchInput, q, setQueryState]);

    const fetchList = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await listAdminCatalogRequests({
                status,
                requestType: requestType === 'all' ? undefined : requestType,
                q: q || undefined,
                page,
                limit: 20,
            });

            const parsed = parseAdminResponse<CatalogRequestItem, {
                items?: CatalogRequestItem[];
                pagination?: { page: number; limit: number; total: number; totalPages: number };
            }>(response);

            setItems(parsed.items);

            const apiPagination = parsed.data?.pagination;
            if (apiPagination) {
                setPagination(apiPagination);
            } else {
                setPagination({
                    page,
                    limit: 20,
                    total: parsed.items.length,
                    totalPages: Math.max(1, Math.ceil(parsed.items.length / 20)),
                });
            }
        } catch (fetchError) {
            setError(extractAdminApiErrorMessage(fetchError, 'Failed to fetch catalog requests'));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, q, requestType, status]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await getAdminCatalogRequestStats(requestType === 'all' ? undefined : requestType);
            const parsed = parseAdminResponse<never, CatalogRequestStats>(response);
            setStats(parsed.data);
        } catch {
            setStats(null);
        }
    }, [requestType]);

    const fetchReferenceMaps = useCallback(async () => {
        try {
            const [categoriesResponse, brandsResponse] = await Promise.all([
                getCategories({ page: 1, limit: 500, status: 'all' }),
                getBrands({ page: 1, limit: 500, status: 'all' }),
            ]);

            const categoriesParsed = parseAdminResponse<{ id: string; name: string }>(categoriesResponse);
            const brandsParsed = parseAdminResponse<{ id: string; name: string }>(brandsResponse);

            setCategoryMap(
                categoriesParsed.items.reduce<NameMap>((acc, item) => {
                    if (item.id) acc[item.id] = item.name;
                    return acc;
                }, {})
            );

            setBrandMap(
                brandsParsed.items.reduce<NameMap>((acc, item) => {
                    if (item.id) acc[item.id] = item.name;
                    return acc;
                }, {})
            );
        } catch {
            setCategoryMap({});
            setBrandMap({});
        }
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        void fetchReferenceMaps();
    }, [fetchReferenceMaps]);

    const refreshAll = useCallback(async () => {
        await Promise.all([fetchList(), fetchStats()]);
    }, [fetchList, fetchStats]);

    const openDetails = useCallback(async (request: CatalogRequestItem) => {
        setDrawerOpen(true);
        setSelectedRequest(request);
        setDetailLoading(true);

        try {
            const response = await getAdminCatalogRequestById(request.id);
            const parsed = parseAdminResponse<CatalogRequestItem, CatalogRequestItem>(response);
            if (parsed.data) {
                setSelectedRequest(parsed.data);
            }
        } catch (detailError) {
            showToast(extractAdminApiErrorMessage(detailError, 'Failed to load request details'), 'error');
        } finally {
            setDetailLoading(false);
        }
    }, [showToast]);

    const runMutation = useCallback(async (operation: () => Promise<void>) => {
        setMutating(true);
        try {
            await operation();
            await refreshAll();
            if (selectedRequest) {
                await openDetails(selectedRequest);
            }
        } finally {
            setMutating(false);
        }
    }, [openDetails, refreshAll, selectedRequest]);

    const handleApprove = useCallback(async (adminNotes?: string) => {
        if (!selectedRequest) return;

        await runMutation(async () => {
            await approveAdminCatalogRequest(selectedRequest.id, adminNotes ? { adminNotes } : undefined);
            showToast('Catalog request approved', 'success');
        });
    }, [runMutation, selectedRequest, showToast]);

    const handleReject = useCallback(async (rejectionReason: string, adminNotes?: string) => {
        if (!selectedRequest) return;

        await runMutation(async () => {
            await rejectAdminCatalogRequest(selectedRequest.id, { rejectionReason, adminNotes });
            showToast('Catalog request rejected', 'success');
        });
    }, [runMutation, selectedRequest, showToast]);

    const handleMarkDuplicate = useCallback(async (duplicateOfEntityId: string, adminNotes?: string) => {
        if (!selectedRequest) return;

        await runMutation(async () => {
            await markAdminCatalogRequestDuplicate(selectedRequest.id, { duplicateOfEntityId, adminNotes });
            showToast('Catalog request marked as duplicate', 'success');
        });
    }, [runMutation, selectedRequest, showToast]);

    const handleBulkApprove = useCallback(async () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        
        await runMutation(async () => {
            const response = await bulkApproveAdminCatalogRequests({ ids });
            const successes = response.data?.results.filter(r => r.status === 'success').length || 0;
            showToast(`Bulk approved ${successes} requests`, successes > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
        });
    }, [runMutation, selectedIds, showToast]);

    const handleBulkReject = useCallback(async () => {
        if (selectedIds.size === 0) return;
        const reason = window.prompt('Please provide a rejection reason for all selected requests:');
        if (!reason) return;

        const ids = Array.from(selectedIds);
        await runMutation(async () => {
            const response = await bulkRejectAdminCatalogRequests({ ids, rejectionReason: reason });
            const successes = response.data?.results.filter(r => r.status === 'success').length || 0;
            showToast(`Bulk rejected ${successes} requests`, successes > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
        });
    }, [runMutation, selectedIds, showToast]);

    const handleBulkMarkDuplicate = useCallback(async () => {
        if (selectedIds.size === 0) return;
        const targetId = window.prompt('Please provide the canonical Brand/Model ObjectId to link all selected requests to:');
        if (!targetId) return;

        const ids = Array.from(selectedIds);
        await runMutation(async () => {
            const response = await bulkMarkAdminCatalogRequestsDuplicate({ ids, duplicateOfEntityId: targetId });
            const successes = response.data?.results.filter(r => r.status === 'success').length || 0;
            showToast(`Bulk marked ${successes} requests as duplicate`, successes > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
        });
    }, [runMutation, selectedIds, showToast]);

    const toggleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(item => item.id)));
        }
    }, [isAllSelected, items]);

    const toggleSelectItem = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const statusTabs = useMemo(() => {
        const makeHref = (tabStatus: StatusTab) => {
            const params = new URLSearchParams();
            params.set('status', tabStatus);
            if (requestType !== 'all') params.set('requestType', requestType);
            if (q) params.set('q', q);
            return `${pathname}?${params.toString()}`;
        };

        const counts = stats?.byStatus;

        return [
            { label: 'All', href: makeHref('all'), count: counts?.total },
            { label: 'Pending', href: makeHref('pending'), count: counts?.pending },
            { label: 'Approved', href: makeHref('approved'), count: counts?.approved },
            { label: 'Rejected', href: makeHref('rejected'), count: counts?.rejected },
            { label: 'Duplicate', href: makeHref('duplicate'), count: counts?.duplicate },
        ];
    }, [pathname, q, requestType, stats]);

    const columns: ColumnDef<CatalogRequestItem>[] = useMemo(
        () => [
            {
                id: 'selection',
                header: (
                    <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={el => {
                            if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                ),
                cell: (item) => (
                    <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        onClick={e => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                ),
                className: 'w-10 px-4',
                exportValue: () => '',
            },
            {
                header: 'Request',
                cell: (item) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">{item.requestedName}</p>
                            <p className="text-xs text-slate-500">{item.requestType === 'brand' ? 'Brand request' : 'Model request'}</p>
                        </div>
                    </div>
                ),
                exportValue: (item) => item.requestedName,
            },
            {
                header: 'Category',
                cell: (item) => (
                    <div>
                        <p className="font-medium text-slate-800">{categoryMap[item.categoryId] || item.categoryId}</p>
                        {item.requestType === 'model' && (
                            <p className="text-xs text-slate-500">
                                Brand: {item.parentBrandId ? (brandMap[item.parentBrandId] || item.parentBrandId) : 'N/A'}
                            </p>
                        )}
                    </div>
                ),
                exportValue: (item) => categoryMap[item.categoryId] || item.categoryId,
            },
            {
                header: 'Requested By',
                cell: (item) => (
                    <div>
                        <p className="font-medium text-slate-800">{toDisplayName(item)}</p>
                        {item.requestedBy && typeof item.requestedBy !== 'string' && item.requestedBy.email && (
                            <p className="text-xs text-slate-500">{item.requestedBy.email}</p>
                        )}
                    </div>
                ),
                exportValue: (item) => toDisplayName(item),
            },
            {
                header: 'Status',
                cell: (item) => <StatusChip status={item.status} />, 
                exportValue: (item) => item.status,
            },
            {
                header: 'Created',
                cell: (item) => new Date(item.createdAt).toLocaleString(),
                exportValue: (item) => new Date(item.createdAt).toISOString(),
            },
            {
                header: 'Actions',
                className: 'text-right',
                cell: (item) => (
                    <button
                        type="button"
                        onClick={() => void openDetails(item)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50"
                    >
                        View
                    </button>
                ),
                exportValue: () => '',
            },
        ],
        [brandMap, categoryMap, isAllSelected, isSomeSelected, openDetails, selectedIds, toggleSelectAll, toggleSelectItem]
    );

    return (
        <>
            <AdminPageShell
                title="Catalog Requests"
                description="Review user-submitted brand and model requests before creating canonical catalog entities."
                tabs={
                    <div className="space-y-3">
                        <AdminModuleTabs tabs={catalogManagementTabs} />
                        <AdminModuleTabs tabs={statusTabs} variant="pills" />
                    </div>
                }
                className="h-full overflow-y-auto pr-1"
            >
                <div className="space-y-4">
                    <AdminFilterToolbar
                        search={searchInput}
                        onSearchChange={setSearchInput}
                        searchPlaceholder="Search requested name"
                        extraFilters={
                            <select
                                value={requestType}
                                onChange={(event) => setQueryState({ requestType: event.target.value === 'all' ? null : event.target.value, page: null })}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="all">All Request Types</option>
                                <option value="brand">Brand Requests</option>
                                <option value="model">Model Requests</option>
                            </select>
                        }
                    />

                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <DataTable
                        data={items}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="No catalog requests found."
                        enableColumnVisibility
                        enableCsvExport
                        csvFileName="catalog-requests.csv"
                        selectedCount={selectedIds.size}
                        bulkActions={
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleBulkApprove}
                                    disabled={mutating}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    Quick Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkReject}
                                    disabled={mutating}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-rose-700 disabled:opacity-60"
                                >
                                    Quick Reject
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkMarkDuplicate}
                                    disabled={mutating}
                                    className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                    Quick Duplicate
                                </button>
                            </div>
                        }
                        pagination={{
                            currentPage: pagination.page,
                            totalPages: pagination.totalPages,
                            totalItems: pagination.total,
                            pageSize: pagination.limit,
                            onPageChange: (nextPage) => setQueryState({ page: nextPage > 1 ? nextPage : null }),
                        }}
                    />
                </div>
            </AdminPageShell>

            {drawerOpen && (
                <CatalogRequestDetailDrawer
                    item={selectedRequest}
                    loading={detailLoading}
                    onClose={() => {
                        setDrawerOpen(false);
                        setSelectedRequest(null);
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onMarkDuplicate={handleMarkDuplicate}
                    categoryName={selectedRequest ? categoryMap[selectedRequest.categoryId] : undefined}
                    parentBrandName={selectedRequest?.parentBrandId ? brandMap[selectedRequest.parentBrandId] : undefined}
                    mutating={mutating}
                />
            )}
        </>
    );
}
