"use client";

import { useEffect, useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";
import type { ApiKeyItem } from "@/types/adminSession";
import { AlertCircle, Plus, ShieldCheck } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";

const normalizeApiKey = (raw: Record<string, unknown>): ApiKeyItem => ({
  id: String(raw.id || raw._id || ""),
  name: String(raw.name || "Untitled key"),
  key: typeof raw.key === "string" ? raw.key : undefined,
  keyPrefix: String(raw.keyPrefix || ""),
  scopes: Array.isArray(raw.scopes) ? raw.scopes.filter((item): item is string => typeof item === "string") : [],
  status: raw.status === "revoked" ? "revoked" : "active",
  createdBy: raw.createdBy as ApiKeyItem["createdBy"],
  revokedAt: typeof raw.revokedAt === "string" ? raw.revokedAt : undefined,
  expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : undefined,
  lastUsedAt: typeof raw.lastUsedAt === "string" ? raw.lastUsedAt : undefined,
  createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
});

export default function ApiKeysPage() {
  const { showToast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ status: statusFilter, page: "1", limit: "50" }).toString();
      const response = await adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.API_KEYS}?${query}`);
      const parsed = parseAdminResponse<Record<string, unknown>>(response);
      setApiKeys(parsed.items.map(normalizeApiKey));
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApiKeys();
  }, [statusFilter]);

  const createKey = async () => {
    if (!name.trim()) {
      showToast("API key name is required", "error");
      return;
    }

    try {
      const response = await adminFetch<Record<string, unknown>>(ADMIN_ROUTES.API_KEYS, {
        method: "POST",
        body: {
          name: name.trim(),
          scopes: scopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean),
        },
      });
      const parsed = parseAdminResponse<never, Record<string, unknown>>(response);
      const created = parsed.data || {};
      setNewKey(typeof created.key === "string" ? created.key : null);
      setName("");
      setScopes("");
      showToast("API key created", "success");
      await fetchApiKeys();
    } catch (createError) {
      showToast(createError instanceof Error ? createError.message : "Failed to create API key", "error");
    }
  };

  const revokeKey = async (id: string) => {
    try {
      await adminFetch(ADMIN_ROUTES.API_KEY_REVOKE(id), { method: "PATCH", body: {} });
      showToast("API key revoked", "success");
      await fetchApiKeys();
    } catch (revokeError) {
      showToast(revokeError instanceof Error ? revokeError.message : "Failed to revoke API key", "error");
    }
  };

  const columns: ColumnDef<ApiKeyItem>[] = [
    {
      header: "Key",
      cell: (item) => (
        <div>
          <div className="font-semibold text-slate-900">{item.name}</div>
          <div className="font-mono text-xs text-slate-500">{item.keyPrefix}</div>
        </div>
      ),
    },
    {
      header: "Scopes",
      cell: (item) => (
        <div className="max-w-[300px] text-xs text-slate-600">
          {item.scopes.length > 0 ? item.scopes.join(", ") : "No scopes"}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (item) => <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{item.status}</span>,
    },
    {
      header: "Created",
      cell: (item) => new Date(item.createdAt).toLocaleString(),
    },
    {
      header: "Last Used",
      cell: (item) => item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : "Never",
    },
    {
      header: "Actions",
      cell: (item) => (
        <button
          type="button"
          disabled={item.status === "revoked"}
          onClick={() => void revokeKey(item.id)}
          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Revoke
        </button>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="API Keys"
      description="Create and revoke server-side integration keys using the existing admin security API."
      tabs={<AdminModuleTabs tabs={administrationTabs} />}
      className="h-full overflow-y-auto pr-1"
    >
    <div className="space-y-6">

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-slate-900">
          <Plus size={16} />
          <h2 className="text-base font-semibold">Create API Key</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Internal integrations"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Scope list, comma separated"
            value={scopes}
            onChange={(event) => setScopes(event.target.value)}
          />
          <button
            type="button"
            onClick={() => void createKey()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ShieldCheck size={14} /> Create
          </button>
        </div>
        {newKey && (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
            <div className="font-semibold">Copy this key now.</div>
            <div className="mt-1 font-mono break-all">{newKey}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <DataTable
        data={apiKeys}
        columns={columns}
        isLoading={loading}
        emptyMessage="No API keys found."
        enableColumnVisibility
        enableCsvExport
        csvFileName="api-keys.csv"
      />
    </div>
    </AdminPageShell>
  );
}
