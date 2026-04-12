"use client";

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

type AlertTone = "error" | "warning" | "info" | "success";

interface AdminInlineAlertProps {
    message: string;
    tone?: AlertTone;
}

const TONE_CONFIG: Record<AlertTone, { style: string; Icon: React.ElementType }> = {
    error:   { style: "border-red-100 bg-red-50 text-red-600",       Icon: AlertCircle },
    warning: { style: "border-amber-100 bg-amber-50 text-amber-700", Icon: AlertTriangle },
    info:    { style: "border-blue-100 bg-blue-50 text-blue-700",    Icon: Info },
    success: { style: "border-emerald-100 bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
};

export function AdminInlineAlert({ message, tone = "error" }: AdminInlineAlertProps) {
    if (!message) return null;

    const { style, Icon } = TONE_CONFIG[tone];

    return (
        <div className={`flex items-center gap-2 rounded-lg border p-4 text-sm font-medium ${style}`}>
            <Icon size={16} /> {message}
        </div>
    );
}
