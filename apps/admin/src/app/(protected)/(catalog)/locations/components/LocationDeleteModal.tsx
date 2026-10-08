"use client";

import { AlertTriangle, Loader2, Button } from "@esparex/ui";
import { type Location } from "@/types/location";
import { CatalogModal } from "@/components/catalog/CatalogModal";

export function LocationDeleteModal({
    deletingLocation,
    isDeleting,
    onClose,
    onConfirm,
}: {
    deletingLocation: Location | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <CatalogModal
            isOpen={!!deletingLocation}
            onClose={() => !isDeleting && onClose()}
            title="Delete Location"
        >
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-body font-bold text-destructive uppercase tracking-tight">Permanent Deletion</h4>
                        <p className="text-body text-destructive leading-relaxed">
                            Are you sure you want to delete <span className="font-bold">&quot;{deletingLocation?.name || deletingLocation?.city}&quot;</span>?
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
                    <h4 className="flex items-center gap-2 text-body font-semibold text-warning-dark leading-none mb-2">
                        Dependencies Warning
                    </h4>
                    <p className="text-caption text-warning-dark leading-relaxed">
                        This action may fail if this location is actively used by business profiles or existing ads.
                        Consider <span className="font-bold">deactivating</span> it instead to hide it from new selections.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        autoFocus
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={onConfirm}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Confirm Delete"
                        )}
                    </Button>
                </div>
            </div>
        </CatalogModal>
    );
}
