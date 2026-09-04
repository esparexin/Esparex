"use client";

import { useEffect, useState } from "react";
import { DataTable, type ColumnDef, StatusChip, Plus, ShieldCheck, Loader2, AlertCircle } from "@esparex/ui";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import type { ApiKeyItem } from "@/types/adminSession";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { useApiKeys } from "@/hooks/useApiKeys";

export default function ApiKeysPage() {
    const [name, setName] = useState("");
    const [scopes, setScopes] = useState("");
    const [newKey, setNewKey] = useState<string | null>(null);

    const {
        items: apiKeys,
        loading,
        isMutating,
        error,
        statusFilter,
        setStatusFilter,
        fetchApiKeys,
        handleCreateKey,
        handleRevokeKey
    } = useApiKeys("all");

    useEffect(() => {
        void fetchApiKeys();
    }, [fetchApiKeys]);

    const onCreateKey = async () => {
        if (!name.trim()) {
            showAdminPopup({ type: "error", title: "Error", message: "API key name is required" });
            return;
        }

        const scopeList = scopes
            .split(",")
            .map((scope) => scope.trim())
            .filter(Boolean);

        const result = await handleCreateKey(name.trim(), scopeList);
        if (result.success) {
            setNewKey(result.key || null);
            setName("");
            setScopes("");
        }
    };

    const columns: ColumnDef<ApiKeyItem>[] = [
        {
            header: "Key",
            cell: (item) => (
                <div>
                    <div className="font-semibold text-foreground">{item.name}</div>
                    <div className="font-mono text-xs text-foreground-tertiary">{item.keyPrefix}</div>
                </div>
            ),
        },
        {
            header: "Scopes",
            cell: (item) => (
                <div className="max-w-[300px] text-xs text-foreground-secondary">
                    {item.scopes.length > 0 ? item.scopes.join(", ") : "No scopes"}
                </div>
            ),
        },
        {
            header: "Status",
            cell: (item) => <StatusChip status={item.status} />,
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
                    disabled={item.status === "revoked" || isMutating}
                    onClick={() => void handleRevokeKey(item.id)}
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
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-foreground">
                        <Plus size={16} />
                        <h2 className="text-base font-semibold">Create API Key</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="Internal integrations"
                            value={name}
                            disabled={isMutating}
                            onChange={(event) => setName(event.target.value)}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="Scope list, comma separated"
                            value={scopes}
                            disabled={isMutating}
                            onChange={(event) => setScopes(event.target.value)}
                        />
                        <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => void onCreateKey()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                        >
                            {isMutating ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Create
                        </button>
                    </div>
                    {newKey && (
                        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-2">
                            <div className="font-bold flex items-center gap-2">
                                <ShieldCheck size={16} /> IMPORTANT: Copy this key now!
                            </div>
                            <p className="mt-1 text-tiny opacity-80">We only show it once for security reasons. If lost, you must revoke and create a new one.</p>
                            <div className="mt-2 font-mono break-all bg-white/50 p-2 rounded border border-emerald-200 select-all">{newKey}</div>
                        </div>
                    )}
                </div>

                <AdminFilterToolbar
                    showSearch={false}
                    status={statusFilter}
                    onStatusChange={(value) => setStatusFilter(value)}
                    statusOptions={[
                        { value: "all", label: "All" },
                        { value: "active", label: "Active" },
                        { value: "revoked", label: "Revoked" },
                    ]}
                />

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
