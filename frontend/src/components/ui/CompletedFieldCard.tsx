"use client";

import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit } from "lucide-react";

interface CompletedFieldCardProps {
    title: string;
    summary: string;
    onEdit: () => void;
    className?: string;
    variant?: "default" | "compact";
}

/**
 * A card that displays a completed form field with summary and edit button.
 * Used for progressive disclosure in wizard forms.
 */
export function CompletedFieldCard({
    title,
    summary,
    onEdit,
    className,
    variant = "default",
}: CompletedFieldCardProps) {
    if (variant === "compact") {
        return (
            <div
                className={cn(
                    "flex items-center justify-between py-3 px-4 bg-emerald-50/50 border border-emerald-100 rounded-lg",
                    className
                )}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground">{title}:</span>{" "}
                        <span className="text-slate-600 truncate">{summary}</span>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    data-testid="edit-button"
                    className="h-8 px-3 text-emerald-700 hover:bg-emerald-100/50 font-medium shrink-0 ml-2"
                >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                </Button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative bg-emerald-50/50 border border-emerald-100 rounded-lg shadow-sm overflow-hidden",
                className
            )}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground leading-none mb-1">{title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{summary}</p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    data-testid="edit-button"
                    className="h-10 px-4 rounded-xl text-emerald-700 hover:bg-emerald-100/50 font-bold shrink-0 ml-2"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Change
                </Button>
            </div>
        </div>
    );
}
