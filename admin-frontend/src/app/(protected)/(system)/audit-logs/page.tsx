"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { AdminLog } from "@/types/audit";
import { fetchAuditLogs } from "@/lib/api/auditLogs";
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
import { AdminInlineAlert } from "@/components/ui/AdminInlineAlert";

export default function AuditLogsPage() {
    const searchParams = useSearchParams();
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    useEffect(() => {
        const requestedAction = searchParams.get("action");
        setActionFilter(requestedAction && requestedAction.trim().length > 0 ? requestedAction : "all");
    }, [searchParams]);

    const isAccessView = searchParams.get("view") === "access";

    const fetchLogs = async () => {
        setLoading(true);
        try {
            setLogs(
                await fetchAuditLogs({
                    search,
                    action: actionFilter,
                    page: 1,
                    limit: 50,
                })
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchLogs();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, actionFilter]);

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
            title={isAccessView ? "Access Logs" : "System Audit Logs"}
            description={
                isAccessView
                    ? "Review admin access activity and authentication events."
                    : "Review administrative activities and security events."
            }
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
                onSearchChange={setSearch}
                searchPlaceholder="Search by Action, Admin or ID..."
                status={actionFilter}
                onStatusChange={setActionFilter}
                statusOptions={[
                    { value: "all", label: "Every Action" },
                    { value: "LOGIN", label: "Logins" },
                    { value: "ADJUST_WALLET", label: "Wallet Changes" },
                    { value: "APPROVE_AD", label: "Ad Approvals" },
                    { value: "BAN_USER", label: "User Bans" },
                    { value: "UPDATE_SYSTEM_CONFIG", label: "Config Changes" },
                ]}
            />

            <AdminInlineAlert message={error} />

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
                    enableColumnVisibility
                    enableCsvExport
                    csvFileName="audit-logs.csv"
                />
            </div>
        </div>
        </AdminPageShell>
    );
}
