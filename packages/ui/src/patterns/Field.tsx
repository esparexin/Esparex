"use client";

import * as React from "react";
import { cn } from "../utils";
import { FormError } from "../atoms/FormError";

export interface FieldContextValue {
    id: string;
    errorId: string;
    hasError: boolean;
    error?: string;
    required?: boolean;
}

export const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useFieldContext() {
    return React.useContext(FieldContext);
}

export function Field({
    id: customId,
    label,
    error,
    required,
    headerExtra,
    children,
    className,
    labelClassName,
}: {
    id?: string;
    label?: string;
    error?: string;
    required?: boolean;
    headerExtra?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    /** Override label text size/weight for specific form contexts (e.g. compact listing forms). Does not affect the global default. */
    labelClassName?: string;
}) {
    const reactId = React.useId().replace(/:/g, "");
    const resolvedId = customId ?? `field-${reactId}`;
    const errorId = `error-${resolvedId}`;

    return (
        <FieldContext.Provider
            value={{
                id: resolvedId,
                errorId,
                hasError: !!error,
                error,
                required,
            }}
        >
            <div className={cn("space-y-1.5", className)}>
                {label && (
                    <div className="flex items-center justify-between gap-2">
                        <label
                            htmlFor={resolvedId}
                            className={cn(
                                "text-base font-medium leading-snug text-foreground-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                labelClassName
                            )}
                        >
                            {label}
                            {required && <span className="text-destructive ml-1">*</span>}
                        </label>
                        {headerExtra}
                    </div>
                )}
                {children}
                <FormError id={errorId} message={error} className="text-sm font-normal text-destructive" />
            </div>
        </FieldContext.Provider>
    );
}
Field.displayName = "Field";
