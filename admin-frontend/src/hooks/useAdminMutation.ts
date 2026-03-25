"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";

type AdminMutationOptions<T> = {
    failureMessage: string;
    successMessage?: string | ((result: T) => string);
    onSuccess?: (result: T) => Promise<void> | void;
};

export function useAdminMutation() {
    const { showToast } = useToast();
    const [isPending, setIsPending] = useState(false);

    const runMutation = async <T>(
        operation: () => Promise<T>,
        { failureMessage, successMessage, onSuccess }: AdminMutationOptions<T>
    ): Promise<T | null> => {
        setIsPending(true);

        try {
            const result = await operation();

            if (successMessage) {
                showToast(
                    typeof successMessage === "function" ? successMessage(result) : successMessage,
                    "success"
                );
            }

            if (onSuccess) {
                await onSuccess(result);
            }

            return result;
        } catch (error) {
            showToast(error instanceof Error ? error.message : failureMessage, "error");
            return null;
        } finally {
            setIsPending(false);
        }
    };

    return { isPending, runMutation };
}
