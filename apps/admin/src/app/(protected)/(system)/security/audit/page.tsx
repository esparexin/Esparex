"use client";

import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { AdminLog } from "@/types/audit";
import {
    Shield,
    User,
    Activity,
    Database,
    Calendar,
    Terminal
} from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import { useAuditLogs } from "@/hooks/useAuditLogs";

const ACTION_OPTIONS = [
    { value: "all", label: "Every Action" },
    { value: "LOGIN", label: "Logins" },
    { value: "ADJUST_WALLET", label: "Wallet Changes" },
    { value: "APPROVE_AD", label: "Ad Approvals" },
    { value: "BAN_USER", label: "User Bans" },
    { value: "UPDATE_SYSTEM_CONFIG", label: "Config Changes" },
    { value: "expiry_warning_sent", label: "Expiry Warnings" },
    { value: "automated_expiry", label: "Automated Expirations" },
];

const TARGET_TYPE_OPTIONS = [
    { value: "all", label: "All Target Types" },
    { value: "Ad", label: "Ad" },
    { value: "Business", label: "Business" },
    { value: "SmartAlert", label: "Smart Alert" },
    { value: "ExpiryWarning", label: "Expiry Warning" },
    { value: "SpotlightPromotion", label: "Spotlight Promotion" },
    { value: "User", label: "User" },
    { value: "System", label: "System" },
];

export default function AuditLogsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const {
        logs,
        loading,
        error,
        pagination,
        getAuditLogs
    } = useAuditLogs();

    const rawSearch = searchParams.get("q") ?? searchParams.get("search");
    const rawAction = searchParams.get("action");
    const rawTargetType = searchParams.get("targetType");
    const rawPage = searchParams.get("page");

    const search = normalizeSearchParamValue(rawSearch);
    const actionFilter = normalizeSearchParamValue(rawAction) || "all";
    const targetTypeFilter = normalizeSearchParamValue(rawTargetType) || "all";
    const page = parsePositiveIntParam(rawPage, 1);

    const replaceQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    const statusOptions = useMemo(() => {
        if (actionFilter === "all" || ACTION_OPTIONS.some((option) => option.value === actionFilter)) {
            return ACTION_OPTIONS;
        }

        return [
            { value: actionFilter, label: actionFilter.replace(/_/g, " ") },
            ...ACTION_OPTIONS,
        ];
    }, [actionFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void getAuditLogs({
                q: search,
                action: actionFilter,
                targetType: targetTypeFilter,
                page,
                limit: 50,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [actionFilter, targetTypeFilter, page, search, getAuditLogs]);

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                q: search || null,
                search: null,
                action: actionFilter === "all" ? null : actionFilter,
                targetType: targetTypeFilter === "all" ? null : targetTypeFilter,
                page: page > 1 ? page : null,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));

        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [actionFilter, targetTypeFilter, page, pathname, router, search, searchParams]);

    useEffect(() => {
        if (!loading && page > pagination.pages) {
            replaceQueryState({ page: pagination.pages > 1 ? pagination.pages : null });
        }
    }, [loading, page, pagination.pages, replaceQueryState]);

    const columns: ColumnDef<AdminLog>[] = [
        {
            header: "Admin",
            cell: (log) => {
                const admin = (log.adminId && typeof log.adminId === 'object') ? log.adminId : null;
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={14} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900 leading-none mb-1">
                                {admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}` : 'System'}
                            </div>
                            <div className="text-[10px] text-slate-400">{admin?.email || 'automated-task'}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Action",
            cell: (log) => (
                <div className="flex flex-col">
                    <span className="font-bold text-xs text-primary uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Database size={10} /> {log.targetType}
                    </span>
                </div>
            )
        },
        {
            header: "Target ID",
            cell: (log) => (
                <div className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                    {log.targetId || 'N/A'}
                </div>
            )
        },
        {
            header: "Details",
            cell: (log) => (
                <div className="max-w-[300px] truncate text-[10px] text-slate-500 italic bg-slate-50 p-1 rounded border border-slate-100 overflow-hidden">
                    {log.metadata ? JSON.stringify(log.metadata) : 'No extra data'}
                </div>
            )
        },
        {
            header: "Security",
            cell: (log) => (
                <div className="text-[10px] text-slate-400">
                    <div className="flex items-center gap-1"><Shield size={10} /> {log.ipAddress || 'unknown'}</div>
                    <div className="flex items-center gap-1 truncate max-w-[150px]"><Terminal size={10} /> {log.userAgent || 'unknown'}</div>
                </div>
            )
        },
        {
            header: "Timestamp",
            cell: (log) => (
                <div className="text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1"><Calendar size={12} className="text-slate-300" /> {new Date(log.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] ml-4">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="System Audit Logs"
            description="Review administrative activities and security events."
            tabs={<AdminModuleTabs tabs={administrationTabs} />}
            actions={
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-2 text-xs font-bold">
                    <Shield size={16} /> Integrity Verified
                </div>
            }
            className="h-full overflow-y-auto pr-1"
        >
        <div className="space-y-6">

            <AdminFilterToolbar
                search={search}
                onSearchChange={(value) => replaceQueryState({ q: value, search: null, page: null })}
                searchPlaceholder="Search by Action, Admin or ID..."
                status={actionFilter}
                onStatusChange={(value) => replaceQueryState({ action: value === "all" ? null : value, page: null })}
                statusOptions={statusOptions}
                extraFilters={
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-100 pl-4">
                        <Database className="shrink-0 text-slate-400" size={14} aria-hidden="true" />
                        <select
                            value={targetTypeFilter}
                            onChange={(e) => replaceQueryState({ targetType: e.target.value === "all" ? null : e.target.value, page: null })}
                            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-7 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                            {TARGET_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                }
            />

            {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            ) : null}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-black">
                    <Activity size={18} className="text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-700">Audit Trail</h2>
                </div>
                <DataTable
                    data={logs}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="Zero activity logs found in the selected range"
                    pagination={{
                        currentPage: page,
                        totalPages: pagination.pages,
                        totalItems: pagination.total,
                        pageSize: pagination.limit,
                        onPageChange: (nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null }),
                    }}
                    enableColumnVisibility
                    enableCsvExport
                    csvFileName="audit-logs.csv"
                />
            </div>
        </div>
        </AdminPageShell>
    );
}
