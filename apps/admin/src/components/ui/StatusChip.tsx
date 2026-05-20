"use client";

/**
 * StatusChip — canonical status indicator for all admin operational tables.
 * Implements the SSOT color map for all lifecycle statuses across the platform.
 *
 * DO NOT inline status chip UI in individual screens — use this component.
 */

import { API_KEY_STATUS, CHAT_STATUS, LIFECYCLE_STATUS, REPORT_STATUS } from "@shared";

export type StatusValue =
    | typeof LIFECYCLE_STATUS.PENDING
    | typeof LIFECYCLE_STATUS.LIVE
    | typeof LIFECYCLE_STATUS.REJECTED
    | typeof CHAT_STATUS.BLOCKED
    | typeof LIFECYCLE_STATUS.EXPIRED
    | typeof LIFECYCLE_STATUS.DEACTIVATED
    | typeof LIFECYCLE_STATUS.SOLD
    | typeof REPORT_STATUS.OPEN
    | typeof REPORT_STATUS.RESOLVED
    | typeof CHAT_STATUS.CLOSED
    | "new"
    | "refurbished"
    | "used"
    | typeof API_KEY_STATUS.REVOKED
    | string;

type ChipStyle = {
    dot: string;
    text: string;
    label: string;
};

const STATUS_MAP: Record<string, ChipStyle> = {
    pending:     { dot: "bg-amber-400",   text: "text-amber-700",   label: "Pending" },
    live:        { dot: "bg-emerald-500", text: "text-emerald-700", label: "Live" },
    rejected:    { dot: "bg-red-500",     text: "text-red-700",     label: "Rejected" },
    blocked:     { dot: "bg-red-600",     text: "text-red-800",     label: "Blocked" },
    expired:     { dot: "bg-slate-400",   text: "text-slate-600",   label: "Expired" },
    deactivated: { dot: "bg-orange-400",  text: "text-orange-700",  label: "Deactivated" },
    sold:        { dot: "bg-sky-500",     text: "text-sky-700",     label: "Sold" },
    open:        { dot: "bg-amber-400",   text: "text-amber-700",   label: "Open" },
    resolved:    { dot: "bg-emerald-500", text: "text-emerald-700", label: "Resolved" },
    closed:      { dot: "bg-slate-400",   text: "text-slate-600",   label: "Closed" },
    new:         { dot: "bg-emerald-400", text: "text-emerald-700", label: "New" },
    refurbished: { dot: "bg-sky-400",     text: "text-sky-700",     label: "Refurbished" },
    used:        { dot: "bg-orange-400",  text: "text-orange-700",  label: "Used" },
    revoked:     { dot: "bg-red-400",     text: "text-red-700",     label: "Revoked" },
    approved:    { dot: "bg-emerald-500", text: "text-emerald-700", label: "Approved" },
    duplicate:   { dot: "bg-amber-600",   text: "text-amber-800",   label: "Duplicate" },
};

const FALLBACK: ChipStyle = {
    dot:   "bg-slate-300",
    text:  "text-slate-600",
    label: "",
};

interface StatusChipProps {
    status: StatusValue;
    /** Override the display label. Defaults to the capitalised status value. */
    label?: string;
    className?: string;
}

export function StatusChip({ status, label, className = "" }: StatusChipProps) {
    const style = STATUS_MAP[status.toLowerCase()] ?? FALLBACK;
    const displayLabel = label ?? (style.label || status.charAt(0).toUpperCase() + status.slice(1));

    return (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
            <span className={`text-xs font-medium ${style.text}`}>{displayLabel}</span>
        </div>
    );
}
