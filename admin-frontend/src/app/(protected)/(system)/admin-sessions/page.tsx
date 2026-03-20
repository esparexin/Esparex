"use client";

import { useEffect, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";
import type { AdminSessionItem } from "@/types/adminSession";
import { AlertCircle, Power } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { StatusChip } from "@/components/ui/StatusChip";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";

const normalizeAdminSession = (raw: Record<string, unknown>): AdminSessionItem => ({
  id: String(raw.id || raw._id || ""),
  adminId: raw.adminId as AdminSessionItem["adminId"],
  tokenId: typeof raw.tokenId === "string" ? raw.tokenId : undefined,
  ip: typeof raw.ip === "string" ? raw.ip : undefined,
  device: typeof raw.device === "string" ? raw.device : undefined,
  expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : new Date(0).toISOString(),
  revokedAt: typeof raw.revokedAt === "string" ? raw.revokedAt : undefined,
  createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
});

export default function AdminSessionsPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        status: statusFilter,
        page: "1",
        limit: "50",
      }).toString();
      const response = await adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.ADMIN_SESSIONS}?${query}`);
      const parsed = parseAdminResponse<Record<string, unknown>>(response);
      setSessions(parsed.items.map(normalizeAdminSession));
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load admin sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, [statusFilter]);

  const revokeSession = async (id: string) => {
    try {
      await adminFetch(ADMIN_ROUTES.ADMIN_SESSION_REVOKE(id), { method: "PATCH", body: {} });
      showToast("Admin session revoked", "success");
      await fetchSessions();
    } catch (revokeError) {
      showToast(revokeError instanceof Error ? revokeError.message : "Failed to revoke session", "error");
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
          disabled={Boolean(session.revokedAt)}
          onClick={() => void revokeSession(session.id)}
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
        onSearchChange={() => {}}
        searchPlaceholder="Session search not supported"
        status={statusFilter}
        onStatusChange={(val) => setStatusFilter(val)}
        statusOptions={[
          { value: "active",  label: "Active" },
          { value: "revoked", label: "Revoked" },
          { value: "expired", label: "Expired" },
          { value: "all",     label: "All" },
        ]}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
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
    </AdminPageShell>
  );
}
