"use client";

import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Business } from "@/types/business";

interface BusinessDeleteModalProps {
    business: Business;
    description: ReactNode;
    onClose: () => void;
    onConfirm: (id: string) => Promise<void> | void;
}

export function BusinessDeleteModal({
    business,
    description,
    onClose,
    onConfirm,
}: BusinessDeleteModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);

        try {
            await onConfirm(business.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
            <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-100 bg-red-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <Trash2 size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">Delete Business?</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                {business.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    <div className="text-xs text-slate-600 bg-red-50 rounded-lg p-3 border border-red-100">
                        {description}
                    </div>
                </div>

                <div className="px-6 pb-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} />
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
