import { mapErrorToMessage } from '@/utils/errorMapper';
import { hidePopup, showPopup } from '@/lib/popup/popupEvents';
import type { PopupAction } from '@/lib/popup/popupEvents';

export const notify = {
    success(message: string, options?: unknown) {
        void options;
        return showPopup({
            type: "success",
            title: "Success",
            message
        });
    },
    error(
        error: unknown,
        fallbackOrOptions?: string | { onRetry?: () => void } | unknown,
        options?: { onRetry?: () => void }
    ) {
        let message = "";
        let onRetry: (() => void) | undefined;

        if (typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null) {
            const opts = fallbackOrOptions as { onRetry?: () => void };
            message = typeof error === 'string' ? error : mapErrorToMessage(error);
            onRetry = opts.onRetry;
        } else {
            message = typeof error === 'string' ? error : mapErrorToMessage(error, fallbackOrOptions as string | undefined);
            onRetry = options?.onRetry;
        }

        const actions: PopupAction[] | undefined = onRetry
            ? [{ label: "Retry", action: onRetry, isRetry: true }, { label: "Dismiss" }]
            : undefined;

        return showPopup({
            type: "error",
            title: "Request Failed",
            message,
            ...(actions ? { actions } : {}),
        });
    },
    info(message: string, options?: unknown) {
        void options;
        return showPopup({
            type: "info",
            title: "Info",
            message
        });
    },
    warning(message: string, options?: unknown) {
        void options;
        return showPopup({
            type: "warning",
            title: "Warning",
            message
        });
    },
    promise<T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: unknown) => string);
        }
    ) {
        const loadingId = showPopup({
            type: "info",
            title: "Please wait",
            message: messages.loading
        }, { dedupeMs: 0 });

        return promise
            .then((data) => {
                hidePopup(loadingId);
                showPopup({
                    type: "success",
                    title: "Success",
                    message: typeof messages.success === "function" ? messages.success(data) : messages.success
                });
                return data;
            })
            .catch((error) => {
                hidePopup(loadingId);
                const errorMsg = typeof messages.error === 'function'
                    ? messages.error(error)
                    : messages.error;
                showPopup({
                    type: "error",
                    title: "Request Failed",
                    message: typeof error === 'string' ? error : mapErrorToMessage(error, errorMsg)
                });
                throw error;
            });
    },
    dismiss(toastId?: string | number) {
        hidePopup(typeof toastId === "number" ? String(toastId) : toastId);
    }
};
