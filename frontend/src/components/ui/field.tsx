import * as React from "react";
import { cn } from "@/lib/utils";
import { FormError } from "@/components/ui/FormError";

export function Field({
    label,
    error,
    required,
    children,
    className,
}: {
    label?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-sm font-medium leading-snug text-slate-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            {children}
            <FormError message={error} className="text-xs font-medium text-destructive" />
        </div>
    );
}
