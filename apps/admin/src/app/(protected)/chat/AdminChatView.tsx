"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCcw, Search, Shield, AlertTriangle, Ban, X, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import {
  fetchAdminChats,
  adminMuteChat,
  adminExportChat,
  type AdminConvSummary,
  type AdminChatFilter,
} from "@/lib/api/adminChat";
import {
  ADMIN_UI_ROUTES,
  buildAdminRouteWithMergedQuery,
  readPositiveIntParam,
  readStringParam,
} from "@/lib/adminUiRoutes";

const FILTER_OPTIONS: { value: AdminChatFilter; label: string; icon?: ReactNode }[] = [
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

function normalizeFilter(value: string | null): AdminChatFilter {
  return FILTER_OPTIONS.some((option) => option.value === value)
    ? (value as AdminChatFilter)
    : "all";
}

export default function AdminChatView() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = normalizeFilter(searchParams.get("filter"));
  const search = readStringParam(searchParams.get("q") ?? searchParams.get("search"));
  const page = readPositiveIntParam(searchParams.get("page"), 1);

  const [searchInput, setSearchInput] = useState(search);
  const [items, setItems] = useState<AdminConvSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mutingChat, setMutingChat] = useState<AdminConvSummary | null>(null);
  const [muteReason, setMuteReason] = useState("");
  const [isMuting, setIsMuting] = useState(false);

  useEffect(() => {
    void (async () => {
      setSearchInput((prev) => (prev === search ? prev : search));
    })();
  }, [search]);

  const replaceQueryState = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const nextUrl = buildAdminRouteWithMergedQuery(pathname, searchParams, updates);
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      if (nextUrl !== currentUrl) {
        void router.replace(nextUrl, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const canonicalUrl = ADMIN_UI_ROUTES.chat({
      filter: filter !== "all" ? filter : undefined,
      q: search || undefined,
      page: page > 1 ? page : undefined,
    });
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (canonicalUrl !== currentUrl) {
      void router.replace(canonicalUrl, { scroll: false });
    }
  }, [filter, page, pathname, router, search, searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInput === search) return;
      replaceQueryState({ q: searchInput || null, search: null, page: null });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [replaceQueryState, search, searchInput]);

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetchAdminChats({ filter, q: search, page, limit: 20 });
        setItems(res.data ?? []);
        setTotal(res.total ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load chats");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [filter, page, refreshKey, search]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleMute = async (id: string, reason?: string) => {
    try {
      setIsMuting(true);
      await adminMuteChat(id, reason || undefined);
      showAdminPopup({ type: "success", title: "Success", message: "Conversation muted" });
      setMutingChat(null);
      setMuteReason("");
      refresh();
    } catch (e) {
      showAdminPopup({ type: "error", title: "Error", message: e instanceof Error ? e.message : "Failed to mute" });
    } finally {
      setIsMuting(false);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const data = await adminExportChat(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `chat_${id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      showAdminPopup({ type: "error", title: "Error", message: "Export failed" });
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
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 cursor-pointer"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => replaceQueryState({ filter: option.value !== "all" ? option.value : null, page: null })}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-medium transition-colors cursor-pointer ${
                filter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground-secondary hover:bg-muted/50"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  replaceQueryState({ q: searchInput || null, search: null, page: null });
                }
              }}
              placeholder="Search buyer, seller, ad, or conversation ID"
              className="rounded-lg border border-input bg-background py-1.5 pl-7 pr-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-body text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-body">
            <thead className="border-b border-border bg-muted/20 text-caption font-semibold text-foreground-tertiary">
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
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                [...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {[...Array(7)].map((_, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-foreground-subtle">
                    No chats found for this filter.
                  </td>
                </tr>
              ) : (
                items.map((conv) => (
                  <tr key={conv.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{conv.buyerName}</td>
                    <td className="px-4 py-3 text-foreground-secondary">{conv.sellerName}</td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-foreground-secondary" title={conv.adTitle}>
                      {conv.adTitle}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-foreground-tertiary" title={conv.lastMessage}>
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
                    <td className="whitespace-nowrap px-4 py-3 text-foreground-subtle">{timeAgo(conv.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void router.push(ADMIN_UI_ROUTES.chat({ q: conv.id }))}
                          className="text-sky-600 hover:underline text-xs font-medium"
                        >
                          Locate
                        </button>
                        {!conv.isBlocked && (
                          <button
                            type="button"
                            onClick={() => {
                              setMuteReason("");
                              setMutingChat(conv);
                            }}
                            className="text-amber-600 hover:underline text-xs font-medium"
                          >
                            Mute
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleExport(conv.id)}
                          className="text-foreground-tertiary hover:underline text-xs font-medium"
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-body text-foreground-tertiary">
            <span>{total} total conversations</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => replaceQueryState({ page: page - 1 > 1 ? page - 1 : null })}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted/50 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-medium">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => replaceQueryState({ page: page + 1 })}
                className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted/50 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={Boolean(mutingChat)} onOpenChange={(open) => { if (!open) setMutingChat(null); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="border-b border-border p-6 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <DialogTitle className="text-body-lg font-bold text-foreground">Mute Conversation</DialogTitle>
                <DialogDescription className="text-caption text-foreground-tertiary">Silence this chat for all participants.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-tiny font-bold uppercase tracking-wider text-foreground-subtle">
                Reason for Muting (Optional)
              </label>
              <textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder="e.g. Offensive language, Spam..."
                className="w-full min-h-[80px] rounded-lg border border-input bg-background p-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMutingChat(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isMuting}
              onClick={() => mutingChat && handleMute(mutingChat.id, muteReason)}
            >
              {isMuting && <RefreshCcw size={14} className="animate-spin" />}
              Confirm Mute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
