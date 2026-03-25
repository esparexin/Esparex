"use client";

interface CatalogFormActionsProps {
    onCancel: () => void;
    isSubmitting?: boolean;
    submitLabel: string;
    loadingLabel?: string;
    cancelLabel?: string;
}

export function CatalogFormActions({
    onCancel,
    isSubmitting = false,
    submitLabel,
    loadingLabel = "Saving...",
    cancelLabel = "Cancel",
}: CatalogFormActionsProps) {
    return (
        <div className="flex gap-3 pt-4">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
            >
                {cancelLabel}
            </button>
            <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50"
            >
                {isSubmitting ? loadingLabel : submitLabel}
            </button>
        </div>
    );
}
