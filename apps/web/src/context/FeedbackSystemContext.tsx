"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mapErrorToMessage } from "@/lib/errorMapper";

export interface AppSuccessFeedback {
    id: string;
    message: string;
    duration?: number;
}

export interface AppErrorFeedback {
    id: string;
    message: string;
    severity: "low" | "medium" | "high";
    onRetry?: () => void;
}

interface AppFeedbackContextType {
    success: AppSuccessFeedback | null;
    errors: AppErrorFeedback[];
    emitSuccess: (message: string, duration?: number) => void;
    emitError: (error: unknown, options?: { severity?: "low" | "medium" | "high"; onRetry?: () => void }) => void;
    clearSuccess: () => void;
    dismissError: (id: string) => void;
}

const AppFeedbackContext = createContext<AppFeedbackContextType | undefined>(undefined);

export function AppFeedbackProvider({ children }: { children: React.ReactNode }) {
    const [success, setSuccess] = useState<AppSuccessFeedback | null>(null);
    const [errors, setErrors] = useState<AppErrorFeedback[]>([]);

    const emitSuccess = useCallback((message: string, duration = 4000) => {
        const id = Math.random().toString(36).substring(7);
        setSuccess({ id, message, duration });
    }, []);

    const emitError = useCallback((error: unknown, options?: { severity?: "low" | "medium" | "high"; onRetry?: () => void }) => {
        const id = Math.random().toString(36).substring(7);
        let message = "";
        
        if (typeof error === "string") {
            message = error;
        } else {
            message = mapErrorToMessage(error);
        }

        const newError: AppErrorFeedback = {
            id,
            message,
            severity: options?.severity ?? "medium",
            onRetry: options?.onRetry,
        };

        // Enforce Deduplication inside state: Avoid duplicate error messages stacking up
        setErrors((prev) => {
            if (prev.some((e) => e.message === message)) return prev;
            return [...prev, newError];
        });
    }, []);

    const clearSuccess = useCallback(() => setSuccess(null), []);
    const dismissError = useCallback((id: string) => {
        setErrors((prev) => prev.filter((e) => e.id !== id));
    }, []);

    // Auto-dismiss management for success banners
    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => {
            setSuccess(null);
        }, success.duration ?? 4000);
        return () => clearTimeout(timer);
    }, [success]);

    // Handle global custom events from raw JS / API interceptors
    useEffect(() => {
        const handleGlobalError = (event: Event) => {
            const isEnabled = process.env.NEXT_PUBLIC_ENABLE_GLOBAL_ERROR_BANNERS === "true";
            if (!isEnabled) return;

            const customEvent = event as CustomEvent<{ error: unknown; onRetry?: () => void }>;
            emitError(customEvent.detail.error, { onRetry: customEvent.detail.onRetry });
        };

        const handleGlobalSuccess = (event: Event) => {
            const customEvent = event as CustomEvent<{ message: string }>;
            emitSuccess(customEvent.detail.message);
        };

        window.addEventListener("esparex_global_error", handleGlobalError);
        window.addEventListener("esparex_global_success", handleGlobalSuccess);

        return () => {
            window.removeEventListener("esparex_global_error", handleGlobalError);
            window.removeEventListener("esparex_global_success", handleGlobalSuccess);
        };
    }, [emitError, emitSuccess]);

    return (
        <AppFeedbackContext.Provider value={{ success, errors, emitSuccess, emitError, clearSuccess, dismissError }}>
            {children}
        </AppFeedbackContext.Provider>
    );
}

export function useAppFeedback() {
    const context = useContext(AppFeedbackContext);
    if (!context) {
        throw new Error("useAppFeedback must be used within an AppFeedbackProvider");
    }
    return context;
}
