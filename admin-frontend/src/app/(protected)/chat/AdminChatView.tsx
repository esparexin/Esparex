"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Search, Shield, AlertTriangle, Ban, X } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { useToast } from "@/context/ToastContext";
import {
  fetchAdminChats,
  adminMuteChat,
  adminExportChat,
  type AdminConvSummary,
  type AdminChatFilter,
} from "@/lib/api/adminChat";

const FILTER_OPTIONS: { value: AdminChatFilter; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "All Chats" },
  { value: "reported", label: "Reported", icon: <AlertTriangle size={14} /> },
  { value: "high_risk", label: "High Risk", icon: <Shield size={14} /> },
  { value: "blocked", label: "Blocked", icon: <Ban size={14} /> },
  { value: "closed", label: "Closed", icon: <X size={14} /> },
];

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminChatView() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<AdminChatFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminConvSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetchAdminChats({ filter, search, page, limit: 20 });
      setItems(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chats");
    } finally {
      setIsLoading(false);
    }
  }, [filter, search, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleMute = async (id: string) => {
    const reason = window.prompt("Reason for muting (optional):") ?? undefined;
    try {
      await adminMuteChat(id, reason || undefined);
      showToast("Conversation muted", "success");
      refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to mute", "error");
    }
  };

  const handleExport = async (id: string) => {
    try {
      const data = await adminExportChat(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Export failed", "error");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminPageShell
      headerVariant="compact"
      title="Chat Moderation"
      actions={
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setFilter(opt.value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-sky-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search buyer, seller, ad..."
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Buyer</th>
                <th className="px-4 py-3 text-left">Seller</th>
                <th className="px-4 py-3 text-left">Ad</th>
                <th className="px-4 py-3 text-left">Last Message</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-slate-100 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No chats found for this filter.
                  </td>
                </tr>
              ) : (
                items.map((conv) => (
                  <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{conv.buyerName}</td>
                    <td className="px-4 py-3 text-slate-600">{conv.sellerName}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-slate-600" title={conv.adTitle}>
                      {conv.adTitle}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-slate-500" title={conv.lastMessage}>
                      {conv.lastMessage ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {conv.isBlocked ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Blocked</span>
                      ) : conv.isAdClosed ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Closed</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{timeAgo(conv.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/chat/${conv.id}`}
                          className="text-sky-600 hover:underline text-xs font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                        {!conv.isBlocked && (
                          <button
                            type="button"
                            onClick={() => handleMute(conv.id)}
                            className="text-amber-600 hover:underline text-xs font-medium"
                          >
                            Mute
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExport(conv.id)}
                          className="text-slate-500 hover:underline text-xs font-medium"
                        >
                          Export
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{total} total conversations</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-medium">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
