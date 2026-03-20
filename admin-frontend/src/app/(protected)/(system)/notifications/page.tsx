"use client";

import { useEffect, useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { NotificationLog } from "@/types/notification";
import {
    Send,
    History,
    Users,
    Globe,
    Smartphone,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { notificationsTabs } from "@/components/layout/adminModuleTabSets";

export default function NotificationsPage() {
    const [history, setHistory] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form State
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [targetType, setTargetType] = useState<"all" | "topic" | "users">("all");
    const [targetValue, setTargetValue] = useState("");

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await adminFetch<any>(ADMIN_ROUTES.NOTIFICATIONS_HISTORY);
            const parsed = parseAdminResponse<NotificationLog>(response);
            setHistory(parsed.items);
        } catch (err) {
            console.error("Failed to load notification history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchHistory();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                title,
                body,
                targetType,
                targetValue: targetType === 'topic' ? targetValue : undefined,
                // userIds could be added here for 'users' target type
            };

            await adminFetch(ADMIN_ROUTES.NOTIFICATIONS_SEND, {
                method: "POST",
                body: payload
            });

            setSuccess("Notification sent successfully!");
            setTitle("");
            setBody("");
            void fetchHistory();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    const columns: ColumnDef<NotificationLog>[] = [
        {
            header: "Notification",
            cell: (log) => (
                <div className="max-w-[300px]">
                    <div className="font-bold text-slate-900 truncate">{log.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{log.body}</div>
                </div>
            )
        },
        {
            header: "Target",
            cell: (log) => (
                <div className="flex items-center gap-2">
                    {log.targetType === 'all' ? <Globe size={14} className="text-blue-500" /> :
                        log.targetType === 'users' ? <Users size={14} className="text-purple-500" /> :
                            <Smartphone size={14} className="text-emerald-500" />}
                    <span className="capitalize text-xs font-medium">{log.targetType}</span>
                    {log.targetValue && <span className="text-[10px] text-slate-400">({log.targetValue})</span>}
                </div>
            )
        },
        {
            header: "Delivery",
            cell: (log) => (
                <div className="text-xs">
                    <span className="text-emerald-600 font-bold">{log.successCount}</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-red-500 font-bold">{log.failureCount}</span>
                </div>
            )
        },
        {
            header: "Status",
            cell: (log) => (
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${log.status === 'sent' ? "bg-emerald-100 text-emerald-700" :
                    log.status === 'failed' ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                    }`}>
                    {log.status}
                </span>
            )
        },
        {
            header: "Sent By",
            cell: (log) => {
                const admin = (log.sentBy && typeof log.sentBy === 'object') ? log.sentBy : null;
                return <span className="text-xs text-slate-500">{admin?.firstName || 'System'}</span>;
            }
        },
        {
            header: "Date",
            cell: (log) => (
                <div className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString()}
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Notification Center"
            description="Broadcast push notifications and announcements to users"
            tabs={<AdminModuleTabs tabs={notificationsTabs} />}
        >
        <div className="space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Send size={20} className="text-primary" />
                        Create Broadcast
                    </h2>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Audience</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetType("all")}
                                    className={`py-2 px-1 rounded-lg border text-[10px] font-bold transition-all ${targetType === "all" ? "bg-primary text-white border-primary" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                                >
                                    All Users
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType("topic")}
                                    className={`py-2 px-1 rounded-lg border text-[10px] font-bold transition-all ${targetType === "topic" ? "bg-primary text-white border-primary" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                                >
                                    Topic
                                </button>
                                <button
                                    type="button"
                                    disabled
                                    className="py-2 px-1 rounded-lg border text-[10px] font-bold bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                                >
                                    Segment
                                </button>
                            </div>
                        </div>

                        {targetType === "topic" && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 tracking-wider mb-1 uppercase">Topic Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. android_users"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none text-black"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 tracking-wider mb-1 uppercase">Notification Title</label>
                            <input
                                type="text"
                                placeholder="Whats new today?"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none text-black"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 tracking-wider mb-1 uppercase">Message Body</label>
                            <textarea
                                placeholder="Type your message here..."
                                rows={4}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none text-black"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        {error && <div className="text-xs text-red-500 flex items-center gap-1 italic"><AlertCircle size={14} /> {error}</div>}
                        {success && <div className="text-xs text-emerald-500 flex items-center gap-1 italic"><CheckCircle2 size={14} /> {success}</div>}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-3 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            {sending ? "Sending..." : "Send Broadcast"}
                        </button>
                    </form>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <History size={20} className="text-slate-400" />
                            Recent Activity
                        </h2>
                        <DataTable
                            data={history}
                            columns={columns}
                            isLoading={loading}
                            emptyMessage="No notifications have been sent yet"
                        />
                    </div>
                </div>
            </div>
        </div>
        </AdminPageShell>
    );
}
