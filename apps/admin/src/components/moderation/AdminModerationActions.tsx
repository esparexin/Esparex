import { Ban, Check, Eye, Pause, Trash2, X, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { ModerationStatus } from "./moderationTypes";

type AdminModerationActionsProps = {
    status: ModerationStatus;
    onView?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onDeactivate?: () => void;
    onActivate?: () => void;
    onDelete?: () => void;
    onBlockSeller?: () => void;
    publicUrl?: string;
};

type ActionButtonProps = {
    label: string;
    ariaLabel: string;
    className: string;
    onClick: () => void;
    children: ReactNode;
};

function ActionButton({ label, ariaLabel, className, onClick, children }: ActionButtonProps) {
    return (
        <div className="group/btn relative">
            <button
                type="button"
                onClick={onClick}
                className={`rounded-md p-2 transition-colors ${className}`}
                aria-label={ariaLabel}
            >
                {children}
            </button>
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/btn:opacity-100">
                {label}
            </span>
        </div>
    );
}

export function AdminModerationActions({
    status,
    onView,
    onApprove,
    onReject,
    onDeactivate,
    onActivate,
    onDelete,
    onBlockSeller,
    publicUrl
}: AdminModerationActionsProps) {
    const showApprove = status === "pending" && Boolean(onApprove);
    const showReject = status === "pending" && Boolean(onReject);
    const showDeactivate = status === "live" && Boolean(onDeactivate);
    const showActivate = status === "deactivated" && Boolean(onActivate);
    const showDelete = (status === "deactivated" || status === "rejected" || status === "expired") && Boolean(onDelete);
    const showBlockSeller = status === "live" && Boolean(onBlockSeller);

    return (
        <div className="flex items-center justify-end gap-1">
            {onView && (
                <ActionButton
                    label="View Details"
                    ariaLabel="View details"
                    onClick={onView}
                    className="text-slate-600 hover:bg-slate-100"
                >
                    <Eye size={16} />
                </ActionButton>
            )}

            {showApprove && (
                <ActionButton
                    label="Approve"
                    ariaLabel="Approve"
                    onClick={onApprove!}
                    className="text-emerald-600 hover:bg-emerald-50"
                >
                    <Check size={16} />
                </ActionButton>
            )}

            {showReject && (
                <ActionButton
                    label="Reject"
                    ariaLabel="Reject"
                    onClick={onReject!}
                    className="text-red-600 hover:bg-red-50"
                >
                    <X size={16} />
                </ActionButton>
            )}

            {showDeactivate && (
                <ActionButton
                    label="Deactivate"
                    ariaLabel="Deactivate"
                    onClick={onDeactivate!}
                    className="text-orange-600 hover:bg-orange-50"
                >
                    <Pause size={16} />
                </ActionButton>
            )}

            {showActivate && (
                <ActionButton
                    label="Activate"
                    ariaLabel="Activate"
                    onClick={onActivate!}
                    className="text-emerald-700 hover:bg-emerald-50"
                >
                    <Check size={16} />
                </ActionButton>
            )}

            {showDelete && (
                <ActionButton
                    label="Delete"
                    ariaLabel="Delete"
                    onClick={onDelete!}
                    className="text-slate-700 hover:bg-slate-100"
                >
                    <Trash2 size={16} />
                </ActionButton>
            )}

            {showBlockSeller && onBlockSeller && (
                <ActionButton
                    label="Block Seller"
                    ariaLabel="Block seller"
                    onClick={onBlockSeller}
                    className="text-rose-700 hover:bg-rose-50"
                >
                    <Ban size={16} />
                </ActionButton>
            )}

            {publicUrl && (
                <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-md transition-colors"
                    title="View Public Page"
                >
                    <ExternalLink size={16} />
                </a>
            )}
        </div>
    );
}
