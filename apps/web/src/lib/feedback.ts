import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import { popupBus } from "@/lib/popup";

export const notify = {
    success(message: string, _options?: { duration?: number; description?: string }) {
        if (typeof window !== "undefined") {
            logger.info("[SUCCESS]", message);
            popupBus.show({
                type: "success",
                title: "Success",
                message,
            });
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
            logger.error("[ERROR]", message);
            popupBus.show({
                type: "error",
                title: "Error",
                message: message || "An unexpected error occurred.",
            });
        }
    },

    info(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            logger.info("[INFO]", message);
            popupBus.show({
                type: "info",
                title: "Info",
                message,
            });
        }
    },

    warning(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            logger.warn("[WARNING]", message);
            popupBus.show({
                type: "warning",
                title: "Warning",
                message,
            });
        }
    }
};

declare global {
    interface Window {
        __esparex_notify?: typeof notify;
    }
}

if (typeof window !== "undefined") {
    window.__esparex_notify = notify;
}

