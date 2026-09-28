"use client";

/**
 * StatusChip — canonical status indicator for all admin operational tables.
 * Implements the SSOT color map for all lifecycle statuses across the platform.
 *
 * DO NOT inline status chip UI in individual screens — use this component.
 */

import { API_KEY_STATUS, CHAT_STATUS, LIFECYCLE_STATUS, REPORT_STATUS } from "@esparex/contracts";

type StatusValue =
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
    pending:     { dot: "bg-warning",   text: "text-warning",   label: "Pending" },
    live:        { dot: "bg-primary", text: "text-primary", label: "Live" },
    rejected:    { dot: "bg-destructive",     text: "text-destructive",     label: "Rejected" },
    blocked:     { dot: "bg-destructive",     text: "text-destructive",     label: "Blocked" },
    expired:     { dot: "bg-muted-foreground",   text: "text-muted-foreground",   label: "Expired" },
    deactivated: { dot: "bg-warning",  text: "text-warning",  label: "Deactivated" },
    sold:        { dot: "bg-primary",     text: "text-primary",     label: "Sold" },
    open:        { dot: "bg-warning",   text: "text-warning",   label: "Open" },
    resolved:    { dot: "bg-primary", text: "text-primary", label: "Resolved" },
    closed:      { dot: "bg-muted-foreground",   text: "text-muted-foreground",   label: "Closed" },
    active:      { dot: "bg-primary", text: "text-primary", label: "Live" },
    published:   { dot: "bg-primary", text: "text-primary", label: "Live" },
    new:         { dot: "bg-primary",     text: "text-primary",     label: "New" },
    refurbished: { dot: "bg-primary",     text: "text-primary",     label: "Refurbished" },
    used:        { dot: "bg-warning",  text: "text-warning",  label: "Used" },
    revoked:     { dot: "bg-destructive",     text: "text-destructive",     label: "Revoked" },
    approved:    { dot: "bg-primary", text: "text-primary", label: "Approved" },
    duplicate:   { dot: "bg-warning",   text: "text-warning",   label: "Duplicate" },
    success:     { dot: "bg-primary", text: "text-primary", label: "Success" },
    delivered:   { dot: "bg-primary",     text: "text-primary",     label: "Delivered" },
    initiated:   { dot: "bg-warning",   text: "text-warning",   label: "Initiated" },
    failed:      { dot: "bg-destructive",     text: "text-destructive",     label: "Failed" },
};

const FALLBACK: ChipStyle = {
    dot:   "bg-muted-foreground",
    text:  "text-muted-foreground",
    label: "",
};

interface StatusChipProps {
    status: StatusValue;
    /** Override the display label. Defaults to the capitalised status value. */
    label?: string;
    className?: string;
}

export function StatusChip({ status, label, className = "" }: StatusChipProps) {
    const normalizedStatus = (status ?? "").toLowerCase();
    const style = STATUS_MAP[normalizedStatus] ?? FALLBACK;
    const displayLabel = label ?? (style.label || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"));

    return (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
            <span className={`text-tiny font-medium ${style.text}`}>{displayLabel}</span>
        </div>
    );
}
