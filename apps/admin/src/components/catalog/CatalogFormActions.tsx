"use client";

import { Button } from "@esparex/ui";

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
            <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
            >
                {cancelLabel}
            </Button>
            <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
            >
                {isSubmitting ? loadingLabel : submitLabel}
            </Button>
        </div>
    );
}
