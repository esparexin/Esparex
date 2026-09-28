"use client";

import { CheckCircle, XCircle, Loader2 } from "@esparex/ui";

export function CatalogActiveToggleButton({
    isActive,
    onClick,
    activeLabel = "Active",
    inactiveLabel = "Inactive",
    disabled = false,
    loading = false,
}: {
    isActive: boolean;
    onClick: () => void;
    activeLabel?: string;
    inactiveLabel?: string;
    disabled?: boolean;
    loading?: boolean;
}) {
    return (
        <button type="button" onClick={onClick} disabled={disabled || loading}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded text-tiny font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {isActive ? activeLabel : inactiveLabel}
        </button>
    );
}
