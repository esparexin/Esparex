import { mapErrorToMessage } from "@/lib/errorMapper";

export const notify = {
    success(message: string, _options?: { duration?: number; description?: string }) {
        if (typeof window !== "undefined") {
            console.log("[SUCCESS]", message);
        }
    },

    error(
        error: unknown,
        fallbackOrOptions?: string | { onRetry?: () => void } | unknown,
        _options?: { onRetry?: () => void }
    ) {
        let message = "";

        if (
            typeof fallbackOrOptions === "object" &&
            fallbackOrOptions !== undefined &&
            !Array.isArray(fallbackOrOptions)
        ) {
            message = typeof error === "string" ? error : mapErrorToMessage(error);
        } else {
            message = typeof error === "string"
                ? error
                : mapErrorToMessage(error, fallbackOrOptions as string | undefined);
        }

        if (typeof window !== "undefined") {
            console.error("[ERROR]", message);
        }
    },

    info(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            console.info("[INFO]", message);
        }
    },

    warning(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            console.warn("[WARNING]", message);
        }
    }
};
