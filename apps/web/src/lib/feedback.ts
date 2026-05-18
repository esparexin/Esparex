import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";

export const notify = {
    success(message: string, _options?: { duration?: number; description?: string }) {
        if (typeof window !== "undefined") {
            logger.info("[SUCCESS]", message);
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
        }
    },

    info(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            logger.info("[INFO]", message);
        }
    },

    warning(message: string, _options?: { duration?: number }) {
        if (typeof window !== "undefined") {
            logger.warn("[WARNING]", message);
        }
    }
};
