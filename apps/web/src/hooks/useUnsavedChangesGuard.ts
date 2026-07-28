"use client";

import { useEffect } from "react";

/**
 * Reusable dirty-state guard for warning users before unmounting forms with unsaved changes.
 * Handles `beforeunload` browser events (refresh, tab close, window exit).
 */
export function useUnsavedChangesGuard({
    isDirty,
    message = "You have unsaved changes. Are you sure you want to leave?",
}: {
    isDirty: boolean;
    message?: string;
}) {
    useEffect(() => {
        if (!isDirty || typeof window === "undefined") return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isDirty, message]);
}
