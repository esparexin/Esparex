"use client";

import { useState } from "react";
import { showAdminPopup } from "@/lib/popup/popupEvents";

type AdminMutationOptions<T> = {
    failureMessage: string;
    successMessage?: string | ((result: T) => string);
    onSuccess?: (result: T) => Promise<void> | void;
};

export function useAdminMutation() {
    const [isPending, setIsPending] = useState(false);

    const runMutation = async <T>(
        operation: () => Promise<T>,
        { failureMessage, successMessage, onSuccess }: AdminMutationOptions<T>
    ): Promise<T | null> => {
        setIsPending(true);

        try {
            const result = await operation();

            if (successMessage) {
                const message = typeof successMessage === "function" ? successMessage(result) : successMessage;
                showAdminPopup({
                    type: "success",
                    title: "Success",
                    message,
                });
            }

            if (onSuccess) {
                await onSuccess(result);
            }

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : failureMessage;
            showAdminPopup({
                type: "error",
                title: "Error",
                message,
            });
            return null;
        } finally {
            setIsPending(false);
        }
    };

    return { isPending, runMutation };
}
