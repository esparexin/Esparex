"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        warning: <AlertCircle className="text-amber-500" size={20} />,
    };

    const styles = {
        success: "border-emerald-100 bg-emerald-50 text-emerald-900",
        error: "border-red-100 bg-red-50 text-red-900",
        info: "border-blue-100 bg-blue-50 text-blue-900",
        warning: "border-amber-100 bg-amber-50 text-amber-900",
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 min-w-[320px] max-w-md">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-center gap-3 p-4 rounded-xl border shadow-xl
                            animate-in slide-in-from-right-10 duration-300
                            ${styles[toast.type]}
                        `}
                    >
                        <div className="flex-shrink-0">{icons[toast.type]}</div>
                        <p className="text-sm font-bold flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <X size={16} className="opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
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
