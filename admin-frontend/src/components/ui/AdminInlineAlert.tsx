"use client";

import { AlertCircle } from "lucide-react";

interface AdminInlineAlertProps {
    message: string;
    tone?: "error";
}

export function AdminInlineAlert({ message, tone = "error" }: AdminInlineAlertProps) {
    if (!message) {
        return null;
    }

    const styles =
        tone === "error"
            ? "border-red-100 bg-red-50 text-red-600"
            : "border-slate-200 bg-slate-50 text-slate-700";

    return (
        <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm font-medium ${styles}`}>
            <AlertCircle size={16} /> {message}
        </div>
    );
}
