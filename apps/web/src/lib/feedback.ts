import { mapErrorToMessage } from "@/lib/errorMapper";

export const notify = {
    success(message: string, _options?: { duration?: number; description?: string }) {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("esparex_global_success", {
                detail: { message }
            }));
        }
    },

    error(
        error: unknown,
        fallbackOrOptions?: string | { onRetry?: () => void } | unknown,
        options?: { onRetry?: () => void }
    ) {
        let message = "";
        let onRetry: (() => void) | undefined;

        if (
            typeof fallbackOrOptions === "object" &&
            fallbackOrOptions !== undefined &&
            !Array.isArray(fallbackOrOptions)
        ) {
            const opts = fallbackOrOptions as { onRetry?: () => void };
            message = typeof error === "string" ? error : mapErrorToMessage(error);
            onRetry = opts.onRetry;
        } else {
            message = typeof error === "string"
                ? error
                : mapErrorToMessage(error, fallbackOrOptions as string | undefined);
            onRetry = options?.onRetry;
        }

        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("esparex_global_error", {
                detail: { error: message, onRetry }
            }));
        }
    },

    info(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("esparex_global_error", {
                detail: { error: message }
            }));
        }
    },

    warning(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("esparex_global_error", {
                detail: { error: message }
            }));
        }
    }
};
