"use client";

/**
 * StatusChip — canonical status indicator for all admin operational tables.
 * Implements the SSOT color map for all lifecycle statuses across the platform.
 *
 * DO NOT inline status chip UI in individual screens — use this component.
 */

export type StatusValue =
    | "pending"
    | "live"
    | "rejected"
    | "blocked"
    | "expired"
    | "deactivated"
    | "sold"
    | "open"
    | "resolved"
    | "closed"
    | "new"
    | "refurbished"
    | "used"
    | "revoked"
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
