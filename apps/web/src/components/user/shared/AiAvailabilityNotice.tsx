"use client";

import { AlertCircle } from "@/icons/IconRegistry";

export function AiAvailabilityNotice() {
    return (
        <div className="flex items-start sm:items-center gap-2 py-2.5 px-3 mb-6 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-amber-600" />
            <span>
                <strong className="font-semibold text-amber-900">AI assistance is temporarily unavailable.</strong> <span className="opacity-90">Continue entering your listing manually.</span>
            </span>
        </div>
    );
}
