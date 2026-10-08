"use client";

import { useEffect, useState } from "react";
import { DataTable, type ColumnDef, StatusChip, Button, Power, AlertTriangle, Loader2, AlertCircle } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { useAdminSessions } from "@/hooks/useAdminSessions";
import type { AdminSessionItem } from "@/types/adminSession";
import { formatAppDateTime } from "@esparex/shared";

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
                        <div className="font-semibold text-foreground">
                            {admin?.firstName ? `${admin.firstName} ${admin.lastName || ""}`.trim() : "Unknown admin"}
                        </div>
                        <div className="text-caption text-foreground-tertiary">{admin?.email || "-"}</div>
                    </div>
                );
            },
        },
        {
            header: "Session",
            cell: (session) => (
                <div className="space-y-1 text-caption text-foreground-secondary">
                    <div className="font-mono">{session.tokenId || session.id}</div>
                    <div>{session.ip || "Unknown IP"}</div>
                </div>
            ),
        },
        {
            header: "Device",
            cell: (session) => (
                <div className="max-w-[280px] truncate text-caption text-foreground-secondary">
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
            cell: (session) => formatAppDateTime(session.createdAt),
        },
        {
            header: "Expires",
            cell: (session) => formatAppDateTime(session.expiresAt),
        },
        {
            header: "Actions",
            cell: (session) => (
                <button
                    type="button"
                    disabled={Boolean(session.revokedAt) || isMutating}
                    onClick={() => setRevokingSession(session)}
                    className="inline-flex items-center gap-1 rounded-md border border-warning/20 px-2 py-1 text-caption font-medium text-warning-dark hover:bg-warning/10 disabled:opacity-50"
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
                    showSearch={false}
                    status={statusFilter}
                    onStatusChange={(val) => setStatusFilter(val)}
                    statusOptions={[
                        { value: "active", label: "Active" },
                        { value: "revoked", label: "Revoked" },
                        { value: "expired", label: "Expired" },
                        { value: "all", label: "All" },
                    ]}
                />

                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-body font-medium text-destructive">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

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
                    <div className="flex items-start gap-4 p-4 bg-warning/10 rounded-xl border border-warning/20">
                        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-body font-bold text-warning-dark">Security Warning</h3>
                            <p className="mt-1 text-body text-warning-dark leading-relaxed">
                                Revoking this session will immediately disconnect the administrator. 
                                They will need to log in again to regain access.
                            </p>
                            {revokingSession && (
                                <div className="mt-3 text-tiny font-mono text-warning-dark bg-warning/10 p-2 rounded border border-warning/20">
                                    IP: {revokingSession.ip || "Unknown"} <br/>
                                    ID: {revokingSession.id}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isMutating}
                            onClick={() => setRevokingSession(null)}
                        >
                            Cancel
                        </Button>
                        <button
                            type="button"
                            disabled={isMutating}
                            onClick={onConfirmRevoke}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning text-white text-body font-bold hover:bg-warning-dark transition-all disabled:opacity-70 shadow-sm cursor-pointer"
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
