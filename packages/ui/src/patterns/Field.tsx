"use client";

import * as React from "react";
import { cn } from "../utils";
import { FormError } from "../atoms/FormError";

export interface FieldContextValue {
    id: string;
    errorId: string;
    hasError: boolean;
    error?: string;
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
    children,
    className,
}: {
    id?: string;
    label?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
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
            }}
        >
            <div className={cn("space-y-1.5", className)}>
                {label && (
                    <label
                        htmlFor={resolvedId}
                        className="text-base font-medium leading-snug text-foreground-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
                {children}
                <FormError id={errorId} message={error} className="text-sm font-normal text-destructive" />
            </div>
        </FieldContext.Provider>
    );
}
Field.displayName = "Field";
