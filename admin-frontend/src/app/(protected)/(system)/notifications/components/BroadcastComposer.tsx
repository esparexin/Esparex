"use client";

import { AlertCircle, CheckCircle2, Loader2, Send, X } from "lucide-react";
import { 
    ADMIN_NOTIFICATION_TOPIC_OPTIONS, 
    ADMIN_NOTIFICATION_TARGET_TYPE 
} from "@shared/constants/adminNotificationTargets";
import type { NotificationRecipient } from "../hooks/useNotifications";

interface BroadcastComposerProps {
    sending: boolean;
    title: string;
    setTitle: (val: string) => void;
    body: string;
    setBody: (val: string) => void;
    targetType: "all" | "topic" | "users";
    setTargetType: (val: "all" | "topic" | "users") => void;
    targetValue: string;
    setTargetValue: (val: string) => void;
    actionUrl: string;
    setActionUrl: (val: string) => void;
    sendAt: string;
    setSendAt: (val: string) => void;
    handleSend: (e: React.FormEvent) => void;
    error: string;
    success: string;

    // Recipients
    recipientQuery: string;
    setRecipientQuery: (val: string) => void;
    recipientResults: NotificationRecipient[];
    recipientSearchLoading: boolean;
    recipientSearchError: string;
    selectedUsers: NotificationRecipient[];
    addRecipient: (user: NotificationRecipient) => void;
    removeRecipient: (id: string) => void;
}

const DEFAULT_TOPIC = ADMIN_NOTIFICATION_TOPIC_OPTIONS[0]?.value ?? "";

export function BroadcastComposer({
    sending,
    title, setTitle,
    body, setBody,
    targetType, setTargetType,
    targetValue, setTargetValue,
    actionUrl, setActionUrl,
    sendAt, setSendAt,
    handleSend,
    error,
    success,
    recipientQuery, setRecipientQuery,
    recipientResults,
    recipientSearchLoading,
    recipientSearchError,
    selectedUsers,
    addRecipient,
    removeRecipient
}: BroadcastComposerProps) {
    return (
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
    );
}
