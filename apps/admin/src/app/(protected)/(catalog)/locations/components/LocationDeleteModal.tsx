"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
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
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-red-900 uppercase tracking-tight">Permanent Deletion</h4>
                        <p className="text-sm text-red-800 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold">&quot;{deletingLocation?.name || deletingLocation?.city}&quot;</span>?
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-900 leading-none mb-2">
                        Dependencies Warning
                    </h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        This action may fail if this location is actively used by business profiles or existing ads.
                        Consider <span className="font-bold">deactivating</span> it instead to hide it from new selections.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        disabled={isDeleting}
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        autoFocus
                        disabled={isDeleting}
                        onClick={onConfirm}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all shadow-sm active:transform active:scale-95 disabled:opacity-75"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Confirm Delete"
                        )}
                    </button>
                </div>
            </div>
        </CatalogModal>
    );
}
