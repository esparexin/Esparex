"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Model } from "@esparex/contracts";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { normalizeObjectIdLike } from "@/lib/utils/idUtils";

export function ModelsDeleteModal({ model, isDeleting, onClose, onConfirm }: {
    model: Model | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const m = model as (Model & { parentModelId?: unknown; variantOfModelId?: unknown; treeDepth?: unknown }) | null;
    return (
        <CatalogModal isOpen={!!model} onClose={() => !isDeleting && onClose()} title="Delete Model">
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">Deletion is blocked when dependencies exist</p>
                        <p className="mt-1 text-sm text-red-600"><strong>&ldquo;{model?.name}&rdquo;</strong> cannot be deleted while it has child models, variants, spare parts, listings, or active hierarchy references.</p>
                    </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">Hierarchy impact preview</div>
                    <div className="mt-1 text-xs text-slate-600">
                        Parent: {normalizeObjectIdLike(m?.parentModelId) ?? "None"} · Variant of: {normalizeObjectIdLike(m?.variantOfModelId) ?? "None"} · Depth: {String(m?.treeDepth ?? 0)}
                    </div>
                </div>
                <p className="text-sm text-slate-600">To hide this model temporarily, <strong>deactivate it</strong> instead of deleting.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" disabled={isDeleting} onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">Cancel</button>
                    <button type="button" disabled={isDeleting} onClick={() => void onConfirm()}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                        {isDeleting ? <><Loader2 size={14} className="animate-spin" /> Deleting&hellip;</> : "Delete If Safe"}
                    </button>
                </div>
            </div>
        </CatalogModal>
    );
}
