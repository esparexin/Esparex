"use client";

const toneClasses: Record<"success" | "danger" | "warning" | "neutral", string> = {
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-700",
};

export function CatalogStatusBadge({
    label,
    tone,
}: {
    label: string;
    tone: "success" | "danger" | "warning" | "neutral";
}) {
    return (
        <span className={`inline-flex shrink-0 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${toneClasses[tone]}`}>
            {label}
        </span>
    );
}
