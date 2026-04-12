"use client";

import { useEffect, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import type { AdminSessionItem } from "@/types/adminSession";
import { Power, AlertTriangle, Loader2 } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { StatusChip } from "@/components/ui/StatusChip";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { AdminInlineAlert } from "@/components/ui/AdminInlineAlert";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { useAdminSessions } from "@/hooks/useAdminSessions";

export default function AdminSessionsPage() {
    const {
        sessions,
        loading,
        isMutating,
        error,
        statusFilter,
        setStatusFilter,
        fetchSessions,
        handleRevokeSession
    } = useAdminSessions("active");

    const [revokingSession, setRevokingSession] = useState<AdminSessionItem | null>(null);

    useEffect(() => {
        void fetchSessions();
    }, [fetchSessions]);

    const onConfirmRevoke = async () => {
        if (!revokingSession) return;
        const result = await handleRevokeSession(revokingSession.id);
        if (result.success) {
            setRevokingSession(null);
        }
    };

    const columns: ColumnDef<AdminSessionItem>[] = [
        {
            header: "Admin",
            cell: (session) => {
                const admin = session.adminId && typeof session.adminId === "object" ? session.adminId : null;
                return (
                    <div>
                        <div className="font-semibold text-slate-900">
                            {admin?.firstName ? `${admin.firstName} ${admin.lastName || ""}`.trim() : "Unknown admin"}
                        </div>
                        <div className="text-xs text-slate-500">{admin?.email || "-"}</div>
                    </div>
                );
            },
        },
        {
            header: "Session",
            cell: (session) => (
                <div className="space-y-1 text-xs text-slate-600">
                    <div className="font-mono">{session.tokenId || session.id}</div>
                    <div>{session.ip || "Unknown IP"}</div>
                </div>
            ),
        },
        {
            header: "Device",
            cell: (session) => (
                <div className="max-w-[280px] truncate text-xs text-slate-600">
                    {session.device || "Unknown device"}
                </div>
            ),
        },
        {
            header: "Status",
            cell: (session) => {
                const isRevoked = Boolean(session.revokedAt);
                const isExpired = !isRevoked && new Date(session.expiresAt).getTime() <= Date.now();
                const status = isRevoked ? "revoked" : isExpired ? "expired" : "active";
                return <StatusChip status={status} />;
            },
        },
        {
            header: "Created",
            cell: (session) => new Date(session.createdAt).toLocaleString(),
        },
        {
            header: "Expires",
            cell: (session) => new Date(session.expiresAt).toLocaleString(),
        },
        {
            header: "Actions",
            cell: (session) => (
                <button
                    type="button"
                    disabled={Boolean(session.revokedAt) || isMutating}
                    onClick={() => setRevokingSession(session)}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                >
                    <Power size={12} /> Revoke
                </button>
            ),
        },
    ];

    return (
        <AdminPageShell
            title="Admin Sessions"
            description="Review active, revoked, and expired admin authentication sessions."
            tabs={<AdminModuleTabs tabs={administrationTabs} />}
            className="h-full overflow-y-auto pr-1"
        >
            <div className="space-y-5">
                <AdminFilterToolbar
                    search=""
                    onSearchChange={() => { }}
                    searchPlaceholder="Session search not supported"
                    status={statusFilter}
                    onStatusChange={(val) => setStatusFilter(val)}
                    statusOptions={[
                        { value: "active", label: "Active" },
                        { value: "revoked", label: "Revoked" },
                        { value: "expired", label: "Expired" },
                        { value: "all", label: "All" },
                    ]}
                />

                <AdminInlineAlert message={error || ""} />

                <DataTable
                    data={sessions}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="No admin sessions found."
                    enableColumnVisibility
                    enableCsvExport
                    csvFileName="admin-sessions.csv"
                />
            </div>

            <CatalogModal
                isOpen={!!revokingSession}
                onClose={() => !isMutating && setRevokingSession(null)}
                title="Revoke Admin Session"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">Security Warning</h3>
                            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                                Revoking this session will immediately disconnect the administrator. 
                                They will need to log in again to regain access.
                            </p>
                            {revokingSession && (
                                <div className="mt-3 text-[10px] font-mono text-amber-700 bg-amber-100/50 p-2 rounded border border-amber-200">
                                    IP: {revokingSession.ip || "Unknown"} <br/>
                                    ID: {revokingSession.id}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => setRevokingSession(null)}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isMutating}
                            onClick={onConfirmRevoke}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all disabled:opacity-70 shadow-lg shadow-amber-200"
                        >
                            {isMutating ? (
                                <><Loader2 size={16} className="animate-spin" /> Revoking...</>
                            ) : (
                                "Confirm Revocation"
                            )}
                        </button>
                    </div>
                </div>
            </CatalogModal>
        </AdminPageShell>
    );
}
