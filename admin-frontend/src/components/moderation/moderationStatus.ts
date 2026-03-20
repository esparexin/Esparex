import type { ModerationStatus } from "./moderationTypes";

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
    pending: "Pending",
    live: "Live",
    rejected: "Rejected",
    deactivated: "Deactivated",
    sold: "Sold",
    expired: "Expired"
};

export const MODERATION_STATUS_BADGES: Record<ModerationStatus, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    live: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    deactivated: "bg-orange-100 text-orange-700 border-orange-200",
    sold: "bg-blue-100 text-blue-700 border-blue-200",
    expired: "bg-slate-100 text-slate-600 border-slate-200"
};

export const MODERATION_STATUSES: ModerationStatus[] = [
    "pending",
    "live",
    "rejected",
    "deactivated",
    "sold",
    "expired"
];
