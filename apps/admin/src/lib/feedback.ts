import { showAdminPopup } from "./popup/popupEvents";
import { mapErrorToMessage } from "./mapErrorToMessage";

/**
 * 📢 Unified Admin Feedback Helper
 * Adheres strictly to the single-instance popupBus SSOT.
 */
export const notify = {
  success(message: string, options?: { title?: string }) {
    if (typeof window !== "undefined") {
      showAdminPopup({
        type: "success",
        title: options?.title || "Success",
        message,
      });
    }
  },

  error(
    error: unknown,
    fallbackOrOptions?: string | { title?: string; onRetry?: () => void },
    options?: { title?: string; onRetry?: () => void }
  ) {
    const fallback =
      typeof fallbackOrOptions === "string"
        ? fallbackOrOptions
        : "An unexpected error occurred.";
    const message =
      typeof error === "string" ? error : mapErrorToMessage(error, fallback);

    const title =
      (typeof fallbackOrOptions === "object" && fallbackOrOptions?.title) ||
      options?.title ||
      "Error";

    if (typeof window !== "undefined") {
      showAdminPopup({
        type: "error",
        title,
        message: message || fallback,
      });
    }
  },

  info(message: string, options?: { title?: string }) {
    if (typeof window !== "undefined") {
      showAdminPopup({
        type: "info",
        title: options?.title || "Info",
        message,
      });
    }
  },

  warning(message: string, options?: { title?: string }) {
    if (typeof window !== "undefined") {
      showAdminPopup({
        type: "warning",
        title: options?.title || "Warning",
        message,
      });
    }
  },
};
