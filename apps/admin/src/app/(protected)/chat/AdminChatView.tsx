"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCcw, Search, Shield, AlertTriangle, Ban, X, Button } from "@esparex/ui";
import { AdminPageShell, AdminPagination } from "@/components/layout/AdminPageShell";
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
import { AdminChatTable } from "./components/AdminChatTable";
import { MuteConversationDialog } from "./components/MuteConversationDialog";

const FILTER_OPTIONS: { value: AdminChatFilter; label: string; icon?: ReactNode }[] = [
  { value: "all", label: "All Chats" },
  { value: "reported", label: "Reported", icon: <AlertTriangle size={14} /> },
  { value: "high_risk", label: "High Risk", icon: <Shield size={14} /> },
  { value: "blocked", label: "Blocked", icon: <Ban size={14} /> },
  { value: "closed", label: "Closed", icon: <X size={14} /> },
];

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
  const [prevSearch, setPrevSearch] = useState(search);

  if (prevSearch !== search) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  const [items, setItems] = useState<AdminConvSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [mutingChat, setMutingChat] = useState<AdminConvSummary | null>(null);
  const [muteReason, setMuteReason] = useState("");
  const [isMuting, setIsMuting] = useState(false);

  const replaceQueryState = useCallback(
    (updates: {
      filter?: AdminChatFilter | null;
      q?: string | null;
      search?: string | null;
      page?: number | null;
    }) => {
      const nextHref = buildAdminRouteWithMergedQuery(pathname, searchParams, updates);
      router.replace(nextHref);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const trimmedInput = searchInput.trim();
    if (trimmedInput === search) return;

    const timeoutId = window.setTimeout(() => {
      replaceQueryState({ q: trimmedInput || null, search: null, page: null });
    }, 300);

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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          className="gap-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 cursor-pointer"
        >
          <RefreshCcw size={14} /> Refresh
        </Button>
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

        <AdminChatTable
          items={items}
          isLoading={isLoading}
          onLocate={(id) => void router.push(ADMIN_UI_ROUTES.chat({ q: id }))}
          onMute={(conv) => { setMuteReason(""); setMutingChat(conv); }}
          onExport={handleExport}
        />

        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={20}
          onPageChange={(nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null })}
        />
      </div>

      <MuteConversationDialog
        chat={mutingChat}
        reason={muteReason}
        isMuting={isMuting}
        onReasonChange={setMuteReason}
        onClose={() => setMutingChat(null)}
        onConfirm={handleMute}
      />
    </AdminPageShell>
  );
}
