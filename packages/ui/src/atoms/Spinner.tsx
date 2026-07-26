"use client";

import { Loader2 } from "lucide-react";
import { cn } from "../utils";

interface SpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    label?: string;
}

const SIZE_CLASSES = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
};

export function Spinner({ size = "md", className = "", label = "Loading..." }: SpinnerProps) {
    return (
        <span role="status" className="inline-flex items-center gap-2">
            <Loader2 className={cn("animate-spin text-primary shrink-0", SIZE_CLASSES[size], className)} />
            <span className="sr-only">{label}</span>
        </span>
    );
}
