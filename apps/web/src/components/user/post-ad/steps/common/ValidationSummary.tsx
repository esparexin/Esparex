"use client";

import { usePostAdFlow } from "../../context";

export function ValidationSummary() {
    const { formError } = usePostAdFlow();

    if (!formError) return null;

    return (
        <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
            <p className="font-semibold">Post Ad Error</p>
            <p className="mt-1">{formError || "Please complete required fields before posting."}</p>
        </div>
    );
}
