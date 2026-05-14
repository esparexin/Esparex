"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Search, SearchCheck, XCircle } from 'lucide-react';
import { AdminPageShell } from '@/components/layout/AdminPageShell';
import { AdminModuleTabs } from '@/components/layout/AdminModuleTabs';
import { catalogManagementTabs } from '@/components/layout/adminModuleTabSets';
import { AdminFilterToolbar } from '@/components/layout/AdminFilterToolbar';
import { DataTable, type ColumnDef } from '@/components/ui/DataTable';
import { StatusChip } from '@/components/ui/StatusChip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { getModels } from '@/lib/api/models';
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

type DuplicateTargetOption = {
    id: string;
    label: string;
    meta?: string;
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

function DuplicateTargetPicker({
    requestType,
    value,
    onChange,
    disabled,
}: {
    requestType: CatalogRequestType;
    value: string;
    onChange: (id: string) => void;
    disabled?: boolean;
}) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<DuplicateTargetOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const normalized = query.trim();
        if (normalized.length < 2) {
            setOptions([]);
            setError(null);
            return;
        }

        let active = true;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const response = requestType === 'brand'
                    ? await getBrands({ search: normalized, status: 'active', page: 1, limit: 20 })
                    : await getModels({ search: normalized, status: 'active', page: 1, limit: 20 });

                if (!active) return;
                const parsed = parseAdminResponse<Record<string, unknown>>(response);
                const mapped = parsed.items
                    .map<DuplicateTargetOption | null>((item) => {
                        const id = typeof item.id === 'string'
                            ? item.id
                            : (typeof item._id === 'string' ? item._id : '');
                        if (!id) return null;
                        const label = typeof item.name === 'string'
                            ? item.name
                            : (typeof item.displayName === 'string' ? item.displayName : id);
                        const canonicalName = typeof item.canonicalName === 'string' ? item.canonicalName : undefined;
                        return {
                            id,
                            label,
                            meta: canonicalName && canonicalName !== label ? canonicalName : undefined,
                        };
                    })
                    .filter((option): option is DuplicateTargetOption => Boolean(option));

                setOptions(mapped);
            } catch (searchError) {
                if (!active) return;
                setOptions([]);
                setError(extractAdminApiErrorMessage(searchError, 'Failed to search canonical entities'));
            } finally {
                if (active) setLoading(false);
            }
        }, 250);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [query, requestType]);

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Search Existing {requestType === 'brand' ? 'Brand' : 'Model'}
            </label>
            <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder={`Type at least 2 characters to search ${requestType}s`}
                    disabled={disabled}
                />
                {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
            </div>

            {value ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    Selected canonical entity: <span className="font-semibold">{value}</span>
                </p>
            ) : null}

            {error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
            ) : null}

            {options.length > 0 ? (
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onChange(option.id)}
                            disabled={disabled}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition ${value === option.id
                                ? 'border-sky-300 bg-sky-50 text-sky-900'
                                : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{option.meta || option.id}</p>
                        </button>
                    ))}
                </div>
            ) : query.trim().length >= 2 && !loading ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    No canonical {requestType} found for this query.
                </p>
            ) : null}
        </div>
    );
}

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
                                        <p className="text-xs text-slate-500">Search and select an existing canonical entity.</p>
                                        <div className="mt-3">
                                            <DuplicateTargetPicker
                                                requestType={item.requestType}
                                                value={duplicateOfEntityId}
                                                onChange={setDuplicateOfEntityId}
                                                disabled={mutating}
                                            />
                                        </div>
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
    const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState('');
    const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
    const [bulkDuplicateTargetId, setBulkDuplicateTargetId] = useState('');

    const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));
    const isSomeSelected = items.some(item => selectedIds.has(item.id)) && !isAllSelected;
    const selectedRequestType = useMemo<CatalogRequestType | null>(() => {
        const selectedItems = items.filter((item) => selectedIds.has(item.id));
        const uniqueTypes = new Set(selectedItems.map((item) => item.requestType));
        if (uniqueTypes.size !== 1) return null;
        return selectedItems[0]?.requestType || null;
    }, [items, selectedIds]);

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
            }>(response);

            setItems(parsed.items);

            const apiPagination = parsed.pagination;
            if (apiPagination) {
                setPagination({
                    page: apiPagination.page ?? page,
                    limit: apiPagination.limit ?? 20,
                    total: apiPagination.total ?? parsed.items.length,
                    totalPages: apiPagination.totalPages ?? apiPagination.pages ?? Math.max(1, Math.ceil((apiPagination.total ?? parsed.items.length) / Math.max(1, apiPagination.limit ?? 20))),
                });
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
        const requestIds = Array.from(selectedIds);
        
        await runMutation(async () => {
            const response = await bulkApproveAdminCatalogRequests({ requestIds });
            const successes = response.data?.results.filter(r => r.status === 'success').length || 0;
            showToast(`Bulk approved ${successes} requests`, successes > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
        });
    }, [runMutation, selectedIds, showToast]);

    const handleBulkReject = useCallback(async () => {
        if (selectedIds.size === 0) return;
        setBulkRejectOpen(true);
    }, [selectedIds.size]);

    const handleBulkMarkDuplicate = useCallback(async () => {
        if (selectedIds.size === 0) return;
        if (!selectedRequestType) {
            showToast('Bulk duplicate requires selecting requests of one type (all brand or all model).', 'error');
            return;
        }
        setBulkDuplicateOpen(true);
    }, [selectedIds.size, selectedRequestType, showToast]);

    const confirmBulkReject = useCallback(async () => {
        const reason = bulkRejectReason.trim();
        if (!reason || selectedIds.size === 0) return;

        const requestIds = Array.from(selectedIds);
        await runMutation(async () => {
            const response = await bulkRejectAdminCatalogRequests({ requestIds, reason });
            const successes = response.data?.results.filter(r => r.status === 'success').length || 0;
            showToast(`Bulk rejected ${successes} requests`, successes > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
            setBulkRejectOpen(false);
            setBulkRejectReason('');
        });
    }, [bulkRejectReason, runMutation, selectedIds, showToast]);

    const confirmBulkDuplicate = useCallback(async () => {
        const duplicateOfId = bulkDuplicateTargetId.trim();
        if (!duplicateOfId || selectedIds.size === 0) return;

        const requestIds = Array.from(selectedIds);
        await runMutation(async () => {
            const response = await bulkMarkAdminCatalogRequestsDuplicate({ requestIds, duplicateOfId });
            const successes = response.data?.results.filter(r => r.status === 'success').length || 0;
            showToast(`Bulk marked ${successes} requests as duplicate`, successes > 0 ? 'success' : 'error');
            setSelectedIds(new Set());
            setBulkDuplicateOpen(false);
            setBulkDuplicateTargetId('');
        });
    }, [bulkDuplicateTargetId, runMutation, selectedIds, showToast]);

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
                                    disabled={mutating || (selectedIds.size > 0 && !selectedRequestType)}
                                    title={selectedIds.size > 0 && !selectedRequestType ? 'Select only brand or only model requests for bulk duplicate.' : undefined}
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

            <Dialog
                open={bulkRejectOpen}
                onOpenChange={(open) => {
                    setBulkRejectOpen(open);
                    if (!open) {
                        setBulkRejectReason('');
                    }
                }}
            >
                <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                        <DialogTitle>Bulk Reject Requests</DialogTitle>
                        <DialogDescription>
                            Provide a mandatory rejection reason for all selected catalog requests.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 px-6 py-5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Rejection Reason
                        </label>
                        <textarea
                            value={bulkRejectReason}
                            onChange={(event) => setBulkRejectReason(event.target.value)}
                            className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Explain why these requests are being rejected"
                            disabled={mutating}
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
                        <button
                            type="button"
                            onClick={() => {
                                setBulkRejectOpen(false);
                                setBulkRejectReason('');
                            }}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            disabled={mutating}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void confirmBulkReject()}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                            disabled={mutating || bulkRejectReason.trim().length === 0}
                        >
                            {mutating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Reject Selected
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={bulkDuplicateOpen}
                onOpenChange={(open) => {
                    setBulkDuplicateOpen(open);
                    if (!open) {
                        setBulkDuplicateTargetId('');
                    }
                }}
            >
                <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                        <DialogTitle>Bulk Mark As Duplicate</DialogTitle>
                        <DialogDescription>
                            Search and select the canonical {selectedRequestType === 'brand' ? 'brand' : 'model'} to link all selected requests.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 px-6 py-5">
                        {selectedRequestType ? (
                            <DuplicateTargetPicker
                                requestType={selectedRequestType}
                                value={bulkDuplicateTargetId}
                                onChange={setBulkDuplicateTargetId}
                                disabled={mutating}
                            />
                        ) : (
                            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                Select only one request type to run bulk duplicate.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
                        <button
                            type="button"
                            onClick={() => {
                                setBulkDuplicateOpen(false);
                                setBulkDuplicateTargetId('');
                            }}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            disabled={mutating}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void confirmBulkDuplicate()}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                            disabled={mutating || !selectedRequestType || bulkDuplicateTargetId.trim().length === 0}
                        >
                            {mutating ? <Loader2 size={14} className="animate-spin" /> : <SearchCheck size={14} />}
                            Mark Selected
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
