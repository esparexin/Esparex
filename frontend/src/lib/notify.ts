import { mapErrorToMessage } from '@/utils/errorMapper';
import { hidePopup, showPopup } from '@/lib/popup/popupEvents';

export const notify = {
    success(message: string, options?: unknown) {
        void options;
        return showPopup({
            type: "success",
            title: "Success",
            message
        });
    },
    error(error: unknown, fallbackOrOptions?: string | unknown, _options?: unknown) {
        let message = "";

        if (typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null) {
            message = typeof error === 'string' ? error : mapErrorToMessage(error);
        } else {
            message = typeof error === 'string' ? error : mapErrorToMessage(error, fallbackOrOptions as string | undefined);
        }

        return showPopup({
            type: "error",
            title: "Request Failed",
            message
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
