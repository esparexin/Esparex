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
            <label className="text-tiny font-bold uppercase tracking-wider text-foreground-tertiary">{label}</label>
            {notice}
            <div
                className={cn(
                    isGrid
                        ? "grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3"
                        : "max-h-60 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3",
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
                                    isDanger && "bg-destructive/10 hover:bg-destructive/20",
                                    !isDanger && !isGrid && "hover:bg-card"
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className={cn(
                                        "h-4 w-4 rounded focus-visible:ring-2 focus-visible:ring-primary/40",
                                        isDanger ? "border-destructive/40 text-destructive" : "border-input text-primary"
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
                                        "text-body transition-colors",
                                        isDanger
                                            ? "font-bold text-destructive"
                                            : "text-foreground-secondary group-hover:text-primary",
                                        !isGrid && !isDanger && "font-medium"
                                    )}
                                >
                                    {option.name}
                                    {option.hint ? <span className="ml-1 text-tiny opacity-70">{option.hint}</span> : null}
                                </span>
                            </label>
                        );
                    })
                ) : (
                    <div className="text-caption italic text-foreground-subtle">{emptyMessage || "No categories available"}</div>
                )}
            </div>
            {footer}
        </div>
    );
}
