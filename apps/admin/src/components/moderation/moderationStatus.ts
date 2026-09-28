import { LIFECYCLE_STATUS } from "@esparex/contracts";
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
    pending: "bg-warning/10 text-warning border-warning/20",
    live: "bg-primary/10 text-primary border-primary/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    deactivated: "bg-muted text-foreground-secondary border-border",
    sold: "bg-primary/10 text-primary border-primary/20",
    expired: "bg-muted text-foreground-secondary border-border"
};

export const MODERATION_STATUSES: ModerationStatus[] = [
    LIFECYCLE_STATUS.PENDING,
    LIFECYCLE_STATUS.LIVE,
    LIFECYCLE_STATUS.REJECTED,
    LIFECYCLE_STATUS.DEACTIVATED,
    LIFECYCLE_STATUS.SOLD,
    LIFECYCLE_STATUS.EXPIRED
];
