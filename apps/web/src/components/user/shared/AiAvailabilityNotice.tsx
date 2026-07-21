"use client";

import { AlertCircle } from "@/icons/IconRegistry";

export function AiAvailabilityNotice() {
    return (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-sm font-medium leading-relaxed">
                <p>AI Enhance is currently unavailable.</p>
                <p className="mt-1 opacity-90">Please enter your title and description manually.</p>
            </div>
        </div>
    );
}
