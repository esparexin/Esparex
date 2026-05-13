"use client";

import React, { createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const showToast = useCallback((_message: string, _type: ToastType = "success") => {
        // No-op: Completely disabled all Toast notifications in the user interface
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
