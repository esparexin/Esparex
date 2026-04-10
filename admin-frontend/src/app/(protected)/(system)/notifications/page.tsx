import { mapErrorToMessage } from '@/lib/mapErrorToMessage';
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Globe,
    History,
    Link as LinkIcon,
    Loader2,
    Search,
    Send,
    Smartphone,
    Users,
    X,
} from "lucide-react";

import { ADMIN_NOTIFICATION_TARGET_TYPE, ADMIN_NOTIFICATION_TOPIC_OPTIONS } from "@shared/constants/adminNotificationTargets";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { notificationsTabs } from "@/components/layout/adminModuleTabSets";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import type { NotificationLog } from "@/types/notification";

const HISTORY_STATUS_VALUES = new Set(["all", "sent", "failed", "scheduled"]);
const HISTORY_TARGET_VALUES = new Set(["all", "topic", "users"]);
const HISTORY_LIMIT = 10;

const DEFAULT_TOPIC = ADMIN_NOTIFICATION_TOPIC_OPTIONS[0]?.value ?? "";

type NotificationRecipient = {
    id: string;
    label: string;
    email?: string;
    mobile?: string;
};

const normalizeRecipient = (raw: Record<string, unknown>): NotificationRecipient | null => {
    const id = typeof raw.id === "string" ? raw.id : typeof raw._id === "string" ? raw._id : "";
    if (!id) return null;

    const name =
        typeof raw.name === "string" && raw.name.trim()
            ? raw.name.trim()
            : [raw.firstName, raw.lastName]
                  .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                  .join(" ")
                  .trim();
    const email = typeof raw.email === "string" ? raw.email : undefined;
    const mobile = typeof raw.mobile === "string" ? raw.mobile : undefined;

    return {
        id,
        label: name || email || mobile || id,
        email,
        mobile,
    };
};

const getTargetIcon = (targetType: NotificationLog["targetType"]) => {
    if (targetType === "all") return <Globe size={14} className="text-blue-500" />;
    if (targetType === "users") return <Users size={14} className="text-purple-500" />;
    return <Smartphone size={14} className="text-emerald-500" />;
};

const getTargetLabel = (targetType: NotificationLog["targetType"], targetValue?: string) => {
    if (targetType === "topic" && targetValue) {
        return ADMIN_NOTIFICATION_TOPIC_OPTIONS.find((option) => option.value === targetValue)?.label ?? targetValue;
    }
    if (targetType === "all") return "All Users";
    return "Direct Users";
};

export default function NotificationsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [history, setHistory] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [targetType, setTargetType] = useState<"all" | "topic" | "users">("all");
    const [targetValue, setTargetValue] = useState(DEFAULT_TOPIC);
    const [actionUrl, setActionUrl] = useState("");
    const [sendAt, setSendAt] = useState("");
    const [searchInput, setSearchInput] = useState(normalizeSearchParamValue(searchParams.get("q")));
    const [recipientQuery, setRecipientQuery] = useState("");
    const [recipientResults, setRecipientResults] = useState<NotificationRecipient[]>([]);
    const [recipientSearchLoading, setRecipientSearchLoading] = useState(false);
    const [recipientSearchError, setRecipientSearchError] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<NotificationRecipient[]>([]);

    const page = parsePositiveIntParam(searchParams.get("page"), 1);
    const q = normalizeSearchParamValue(searchParams.get("q"));
    const status = HISTORY_STATUS_VALUES.has(searchParams.get("status") ?? "")
        ? (searchParams.get("status") as "all" | "sent" | "failed" | "scheduled")
        : "all";
    const historyTargetType = HISTORY_TARGET_VALUES.has(searchParams.get("targetType") ?? "")
        ? (searchParams.get("targetType") as "all" | "topic" | "users")
        : "any";

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1,
        limit: HISTORY_LIMIT,
    });

    const replaceQueryState = (updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

    const historyRoute = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(HISTORY_LIMIT));
        if (q) params.set("q", q);
        if (status !== "all") params.set("status", status);
        if (historyTargetType !== "any") params.set("targetType", historyTargetType);
        const query = params.toString();
        return `${ADMIN_ROUTES.NOTIFICATIONS_HISTORY}${query ? `?${query}` : ""}`;
    }, [historyTargetType, page, q, status]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await adminFetch<any>(historyRoute);
            const parsed = parseAdminResponse<NotificationLog>(response);
            setHistory(parsed.items);
            setPagination({
                total: parsed.pagination?.total ?? 0,
                totalPages: parsed.pagination?.totalPages ?? 1,
                limit: parsed.pagination?.limit ?? HISTORY_LIMIT,
            });
        } catch (err) {
            console.error("Failed to load notification history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const normalized = normalizeSearchParamValue(searchInput);
            if (normalized !== q) {
                replaceQueryState({ q: normalized || null, page: null });
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [q, searchInput]);

    useEffect(() => {
        void fetchHistory();
    }, [historyRoute]);

    useEffect(() => {
        if (!loading && page > pagination.totalPages) {
            replaceQueryState({ page: pagination.totalPages > 1 ? pagination.totalPages : null });
        }
    }, [loading, page, pagination.totalPages]);

    useEffect(() => {
        if (targetType !== ADMIN_NOTIFICATION_TARGET_TYPE.USERS) {
            setRecipientResults([]);
            setRecipientSearchLoading(false);
            setRecipientSearchError("");
            return;
        }

        const query = recipientQuery.trim();
        if (query.length < 2) {
            setRecipientResults([]);
            setRecipientSearchLoading(false);
            setRecipientSearchError("");
            return;
        }

        const timer = window.setTimeout(async () => {
            setRecipientSearchLoading(true);
            setRecipientSearchError("");
            try {
                const params = new URLSearchParams({
                    limit: "8",
                    q: query,
                });
                const response = await adminFetch<any>(`${ADMIN_ROUTES.NOTIFICATIONS_RECIPIENTS}?${params.toString()}`);
                const parsed = parseAdminResponse<Record<string, unknown>>(response);
                const selectedIds = new Set(selectedUsers.map((user) => user.id));
                setRecipientResults(
                    parsed.items
                        .map(normalizeRecipient)
                        .filter((user): user is NotificationRecipient => Boolean(user))
                        .filter((user) => !selectedIds.has(user.id))
                );
            } catch (err) {
                setRecipientResults([]);
                setRecipientSearchError(mapErrorToMessage(err, "Failed to search users"));
            } finally {
                setRecipientSearchLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [recipientQuery, selectedUsers, targetType]);

    const addRecipient = (user: NotificationRecipient) => {
        setSelectedUsers((prev) => (prev.some((item) => item.id === user.id) ? prev : [...prev, user]));
        setRecipientQuery("");
        setRecipientResults([]);
    };

    const removeRecipient = (id: string) => {
        setSelectedUsers((prev) => prev.filter((user) => user.id !== id));
    };

    const handleSend = async (event: React.FormEvent) => {
        event.preventDefault();
        setSending(true);
        setError("");
        setSuccess("");

        try {
            if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.USERS && selectedUsers.length === 0) {
                throw new Error("Select at least one recipient");
            }

            await adminFetch(ADMIN_ROUTES.NOTIFICATIONS_SEND, {
                method: "POST",
                body: {
                    title,
                    body,
                    targetType,
                    targetValue: targetType === ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC ? targetValue : undefined,
                    userIds: targetType === ADMIN_NOTIFICATION_TARGET_TYPE.USERS ? selectedUsers.map((user) => user.id) : undefined,
                    actionUrl: actionUrl.trim() || undefined,
                    sendAt: sendAt || undefined,
                },
            });

            setSuccess(sendAt ? "Notification scheduled successfully." : "Notification sent successfully.");
            setTitle("");
            setBody("");
            setActionUrl("");
            setSendAt("");
            if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC) {
                setTargetValue(DEFAULT_TOPIC);
            }
            if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.USERS) {
                setSelectedUsers([]);
                setRecipientQuery("");
            }
            void fetchHistory();
        } catch (err) {
            setError(mapErrorToMessage(err, "Failed to send notification"));
        } finally {
            setSending(false);
        }
    };

    const columns: ColumnDef<NotificationLog>[] = [
        {
            header: "Notification",
            cell: (log) => (
                <div className="max-w-[320px]">
                    <div className="font-bold text-slate-900 truncate">{log.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{log.body}</div>
                    {log.actionUrl ? (
                        <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
                            <LinkIcon size={10} />
                            <span className="truncate">{log.actionUrl}</span>
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            header: "Audience",
            cell: (log) => (
                <div className="flex items-center gap-2">
                    {getTargetIcon(log.targetType)}
                    <div>
                        <div className="text-xs font-semibold text-slate-700">{getTargetLabel(log.targetType, log.targetValue)}</div>
                        {log.targetType === "users" && log.userIds?.length ? (
                            <div className="text-[10px] text-slate-400">{log.userIds.length} users</div>
                        ) : null}
                    </div>
                </div>
            ),
        },
        {
            header: "Delivery",
            cell: (log) => (
                <div className="text-xs">
                    {log.status === "scheduled" ? (
                        <span className="font-semibold text-amber-600">Scheduled</span>
                    ) : (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-bold text-emerald-600">{log.successCount} sent</span>
                            <span className="font-bold text-amber-600">{log.skippedCount} skipped</span>
                            <span className="font-bold text-red-500">{log.failureCount} failed</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: "Status",
            cell: (log) => (
                <span
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        log.status === "sent"
                            ? "bg-emerald-100 text-emerald-700"
                            : log.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                    }`}
                >
                    {log.status}
                </span>
            ),
        },
        {
            header: "Date",
            cell: (log) => (
                <div className="text-xs text-slate-500">
                    <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">
                        {log.status === "scheduled" ? "Scheduled" : "Sent"}{" "}
                        {new Date(log.sendAt || log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                </div>
            ),
        },
    ];

    return (
        <AdminPageShell
            title="Broadcast Console"
            description="Send outbound announcements, schedule delivery, and review broadcast history."
            tabs={<AdminModuleTabs tabs={notificationsTabs} />}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                            <Send size={20} className="text-primary" />
                            Compose Broadcast
                        </h2>
                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Audience
                                </label>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("all")}
                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                                            targetType === "all"
                                                ? "border-primary bg-primary text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        All Users
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTargetType("topic");
                                            if (!targetValue) setTargetValue(DEFAULT_TOPIC);
                                        }}
                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                                            targetType === "topic"
                                                ? "border-primary bg-primary text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        Device Platform
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetType("users")}
                                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                                            targetType === "users"
                                                ? "border-primary bg-primary text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        Specific Users
                                    </button>
                                </div>
                            </div>

                            {targetType === "topic" ? (
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Platform Audience
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                        value={targetValue}
                                        onChange={(event) => setTargetValue(event.target.value)}
                                        required
                                    >
                                        {ADMIN_NOTIFICATION_TOPIC_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Platform audiences are device-platform segments with registered push tokens, not location or seller segments.
                                    </p>
                                </div>
                            ) : null}

                            {targetType === "users" ? (
                                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Search Recipients
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, or mobile..."
                                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                            value={recipientQuery}
                                            onChange={(event) => setRecipientQuery(event.target.value)}
                                        />
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Select one or more active users. Search starts after 2 characters.
                                        </p>
                                    </div>

                                    {selectedUsers.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => removeRecipient(user.id)}
                                                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                                    title="Remove recipient"
                                                >
                                                    <span>{user.label}</span>
                                                    <X size={12} />
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}

                                    {recipientSearchError ? (
                                        <div className="text-xs text-red-500">{recipientSearchError}</div>
                                    ) : null}

                                    {recipientSearchLoading ? (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Loader2 size={14} className="animate-spin" />
                                            Searching users...
                                        </div>
                                    ) : null}

                                    {!recipientSearchLoading && recipientResults.length > 0 ? (
                                        <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                            {recipientResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => addRecipient(user)}
                                                    className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-slate-900">{user.label}</div>
                                                        <div className="truncate text-xs text-slate-500">
                                                            {user.email || user.mobile || user.id}
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                                        Add
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Notification Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="What’s new today?"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Message Body
                                </label>
                                <textarea
                                    placeholder="Type your message here..."
                                    rows={4}
                                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                    value={body}
                                    onChange={(event) => setBody(event.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Action Link
                                </label>
                                <input
                                    type="text"
                                    placeholder="/plans or https://example.com/offers"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                    value={actionUrl}
                                    onChange={(event) => setActionUrl(event.target.value)}
                                />
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Optional deep link shown as an Open button in the user notification inbox.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Schedule For
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                    value={sendAt}
                                    onChange={(event) => setSendAt(event.target.value)}
                                />
                                <p className="mt-1 text-[11px] text-slate-400">Leave empty to send immediately.</p>
                            </div>

                            {error ? (
                                <div className="flex items-center gap-1 text-xs italic text-red-500">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            ) : null}
                            {success ? (
                                <div className="flex items-center gap-1 text-xs italic text-emerald-500">
                                    <CheckCircle2 size={14} /> {success}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={sending}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                {sending ? "Sending..." : sendAt ? "Schedule Broadcast" : "Send Broadcast"}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-4 lg:col-span-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                                <History size={20} className="text-slate-400" />
                                Delivery History
                            </h2>
                            <DataTable
                                data={history}
                                columns={columns}
                                isLoading={loading}
                                emptyMessage="No notifications have been sent or scheduled yet"
                                pagination={{
                                    currentPage: page,
                                    totalPages: pagination.totalPages,
                                    totalItems: pagination.total,
                                    pageSize: pagination.limit,
                                    onPageChange: (nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null }),
                                }}
                                toolbar={
                                    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                                        <div className="relative min-w-[220px] flex-1">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                size={16}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search title or body..."
                                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                                value={searchInput}
                                                onChange={(event) => setSearchInput(event.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                            value={status}
                                            onChange={(event) =>
                                                replaceQueryState({ status: event.target.value === "all" ? null : event.target.value, page: null })
                                            }
                                        >
                                            <option value="all">All statuses</option>
                                            <option value="sent">Sent</option>
                                            <option value="failed">Failed</option>
                                            <option value="scheduled">Scheduled</option>
                                        </select>
                                        <select
                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-primary/20"
                                            value={historyTargetType}
                                            onChange={(event) =>
                                                replaceQueryState({
                                                    targetType: event.target.value === "any" ? null : event.target.value,
                                                    page: null,
                                                })
                                            }
                                        >
                                            <option value="any">All audiences</option>
                                            <option value="all">All Users</option>
                                            <option value="topic">Topic audience</option>
                                            <option value="users">Direct users</option>
                                        </select>
                                    </div>
                                }
                            />
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                                <Clock3 size={16} />
                                What this screen is for
                            </div>
                            <p className="mt-1">
                                This is the outbound broadcast console. Use it for platform announcements, scheduled reminders,
                                and targeted outreach to specific users or device-platform audiences.
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Device platform targeting means users with registered web, Android, or iOS push tokens. It is not a content,
                                city, or seller segment builder.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageShell>
    );
}
