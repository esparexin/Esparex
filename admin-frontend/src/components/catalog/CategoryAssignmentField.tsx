"use client";

import type { ReactNode } from "react";

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export interface CategoryAssignmentOption {
    id: string;
    name: string;
    hint?: string;
    tone?: "default" | "danger";
    title?: string;
}

interface CategoryAssignmentFieldProps {
    label: ReactNode;
    selectedIds: string[];
    options: CategoryAssignmentOption[];
    onChange: (nextSelectedIds: string[]) => void;
    notice?: ReactNode;
    footer?: ReactNode;
    emptyMessage?: ReactNode;
    layout?: "grid" | "list";
    containerClassName?: string;
}

export function CategoryAssignmentField({
    label,
    selectedIds,
    options,
    onChange,
    notice,
    footer,
    emptyMessage,
    layout = "grid",
    containerClassName,
}: CategoryAssignmentFieldProps) {
    const isGrid = layout === "grid";

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
            {notice}
            <div
                className={cn(
                    isGrid
                        ? "grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3"
                        : "max-h-60 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3",
                    containerClassName
                )}
            >
                {options.length > 0 ? (
                    options.map((option) => {
                        const isDanger = option.tone === "danger";
                        const isSelected = selectedIds.includes(option.id);

                        return (
                            <label
                                key={option.id}
                                title={option.title}
                                className={cn(
                                    isGrid ? "flex items-center gap-2" : "flex items-center gap-3 rounded-md p-2 transition-all",
                                    "cursor-pointer group",
                                    isDanger && "bg-red-50/50 hover:bg-red-50",
                                    !isDanger && !isGrid && "hover:bg-white"
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className={cn(
                                        "h-4 w-4 rounded focus:ring-primary/20",
                                        isDanger ? "border-red-300 text-red-500" : "border-slate-300 text-primary"
                                    )}
                                    checked={isSelected}
                                    onChange={(event) => {
                                        const nextSelectedIds = event.target.checked
                                            ? [...selectedIds, option.id]
                                            : selectedIds.filter((id) => id !== option.id);
                                        onChange(nextSelectedIds);
                                    }}
                                />
                                <span
                                    className={cn(
                                        "text-sm transition-colors",
                                        isDanger
                                            ? "font-bold text-red-700"
                                            : "text-slate-700 group-hover:text-primary",
                                        !isGrid && !isDanger && "font-medium"
                                    )}
                                >
                                    {option.name}
                                    {option.hint ? <span className="ml-1 text-[10px] opacity-70">{option.hint}</span> : null}
                                </span>
                            </label>
                        );
                    })
                ) : (
                    <div className="text-xs italic text-slate-400">{emptyMessage || "No categories available"}</div>
                )}
            </div>
            {footer}
        </div>
    );
}
