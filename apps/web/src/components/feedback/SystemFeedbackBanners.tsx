"use client";

import { useAppFeedback } from "@/context/FeedbackSystemContext";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuccessFeedbackBanner() {
    const { success, clearSuccess } = useAppFeedback();
    if (!success) return null;

    return (
        <div className="mx-4 my-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-800 font-inter">{success.message}</p>
            </div>
            <button onClick={clearSuccess} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ErrorFeedbackBanners() {
    const { errors, dismissError } = useAppFeedback();
    if (errors.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 mx-4 my-2">
            {errors.map((err) => (
                <div key={err.id} className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-red-800 font-inter">{err.message}</p>
                            {err.onRetry && (
                                <Button size="sm" onClick={err.onRetry} variant="outline" className="mt-2 border-red-200 text-red-700 hover:bg-red-100 h-8 font-bold">
                                    Retry Action
                                </Button>
                            )}
                        </div>
                    </div>
                    <button onClick={() => dismissError(err.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
