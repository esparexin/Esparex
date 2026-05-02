"use client";

import { useMemo } from "react";
import { 
    Clock3, 
    Globe, 
    History as HistoryIcon, 
    Link as LinkIcon, 
    Smartphone, 
    Users 
} from "lucide-react";
import { ADMIN_NOTIFICATION_TOPIC_OPTIONS } from "@shared/constants/adminNotificationTargets";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import type { NotificationLog } from "@/types/notification";

interface NotificationHistoryProps {
    history: NotificationLog[];
    loading: boolean;
    page: number;
    pagination: {
        total: number;
        totalPages: number;
        limit: number;
    };
    onPageChange: (nextPage: number) => void;
    toolbar: React.ReactNode;
}

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

export function NotificationHistory({
    history,
    loading,
    page,
    pagination,
    onPageChange,
    toolbar
}: NotificationHistoryProps) {
    const columns = useMemo<ColumnDef<NotificationLog>[]>(() => [
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
    ], []);

    return (
        <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <HistoryIcon size={20} className="text-slate-400" />
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
                        onPageChange: onPageChange,
                    }}
                    toolbar={toolbar}
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
    );
}
