"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
    ADMIN_NOTIFICATION_TARGET_TYPE, 
    ADMIN_NOTIFICATION_TOPIC_OPTIONS 
} from "@shared/constants/adminNotificationTargets";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import { mapErrorToMessage } from "@/lib/mapErrorToMessage";
import type { NotificationLog } from "@/types/notification";

const HISTORY_STATUS_VALUES = new Set(["all", "sent", "failed", "scheduled"]);
const HISTORY_TARGET_VALUES = new Set(["all", "topic", "users"]);
const HISTORY_LIMIT = 10;
const DEFAULT_TOPIC = ADMIN_NOTIFICATION_TOPIC_OPTIONS[0]?.value ?? "";

export type NotificationRecipient = {
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

export function useNotifications() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // History & Global State
    const [history, setHistory] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 1,
        limit: HISTORY_LIMIT,
    });

    // Composer State
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [targetType, setTargetType] = useState<"all" | "topic" | "users">("all");
    const [targetValue, setTargetValue] = useState(DEFAULT_TOPIC);
    const [actionUrl, setActionUrl] = useState("");
    const [sendAt, setSendAt] = useState("");

    // Recipient Search State
    const [recipientQuery, setRecipientQuery] = useState("");
    const [recipientResults, setRecipientResults] = useState<NotificationRecipient[]>([]);
    const [recipientSearchLoading, setRecipientSearchLoading] = useState(false);
    const [recipientSearchError, setRecipientSearchError] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<NotificationRecipient[]>([]);

    // History Filters state (local input before sync)
    const page = parsePositiveIntParam(searchParams.get("page"), 1);
    const q = normalizeSearchParamValue(searchParams.get("q"));
    const [searchInput, setSearchInput] = useState(q);

    const status = HISTORY_STATUS_VALUES.has(searchParams.get("status") ?? "")
        ? (searchParams.get("status") as "all" | "sent" | "failed" | "scheduled")
        : "all";
    const historyTargetType = HISTORY_TARGET_VALUES.has(searchParams.get("targetType") ?? "")
        ? (searchParams.get("targetType") as "all" | "topic" | "users")
        : "any";

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
        const queryStr = params.toString();
        return `${ADMIN_ROUTES.NOTIFICATIONS_HISTORY}${queryStr ? `?${queryStr}` : ""}`;
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

    // ── Effects ────────────────────────────────────────────────────────────────

    // Sync input search with URL (Debounced)
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

    // Fetch history on route change
    useEffect(() => {
        void fetchHistory();
    }, [historyRoute]);

    // Page existence validation
    useEffect(() => {
        if (!loading && page > pagination.totalPages && pagination.totalPages > 0) {
            replaceQueryState({ page: pagination.totalPages > 1 ? pagination.totalPages : null });
        }
    }, [loading, page, pagination.totalPages]);

    // Recipient Search (Debounced)
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
                const params = new URLSearchParams({ limit: "8", q: query });
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

    // ── Handlers ─────────────────────────────────────────────────────────────

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
            if (targetType === ADMIN_NOTIFICATION_TARGET_TYPE.TOPIC) setTargetValue(DEFAULT_TOPIC);
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

    return {
        // Data
        history,
        loading,
        error,
        success,
        pagination,
        
        // Router state
        page,
        status,
        historyTargetType,
        searchInput,
        setSearchInput,
        replaceQueryState,

        // Composer
        sending,
        title, setTitle,
        body, setBody,
        targetType, setTargetType,
        targetValue, setTargetValue,
        actionUrl, setActionUrl,
        sendAt, setSendAt,
        handleSend,

        // Recipients
        recipientQuery, setRecipientQuery,
        recipientResults,
        recipientSearchLoading,
        recipientSearchError,
        selectedUsers,
        addRecipient,
        removeRecipient,
    };
}
