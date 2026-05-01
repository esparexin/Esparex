import { toast } from 'sonner';
import { mapErrorToMessage } from "@/lib/errorMapper";

export const notify = {
    success(message: string, options?: { duration?: number; description?: string }) {
        return toast.success(message, {
            duration: options?.duration ?? 4000,
            description: options?.description,
        });
    },

    error(
        error: unknown,
        fallbackOrOptions?: string | { onRetry?: () => void } | unknown,
        options?: { onRetry?: () => void }
    ) {
        let message = "";
        let onRetry: (() => void) | undefined;

        if (
            typeof fallbackOrOptions === 'object' &&
            fallbackOrOptions !== null &&
            !Array.isArray(fallbackOrOptions)
        ) {
            const opts = fallbackOrOptions as { onRetry?: () => void };
            message = typeof error === 'string' ? error : mapErrorToMessage(error);
            onRetry = opts.onRetry;
        } else {
            message = typeof error === 'string'
                ? error
                : mapErrorToMessage(error, fallbackOrOptions as string | undefined);
            onRetry = options?.onRetry;
        }

        return toast.error(message, {
            duration: Infinity,
            ...(onRetry
                ? { action: { label: 'Retry', onClick: onRetry } }
                : {}),
        });
    },

    info(message: string, options?: { duration?: number }) {
        return toast.info(message, {
            duration: options?.duration ?? 4000,
        });
    },

    warning(message: string, options?: { duration?: number }) {
        return toast.warning(message, {
            duration: options?.duration ?? Infinity,
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
        return toast.promise(promise, {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
        });
    },

    dismiss(toastId?: string | number) {
        toast.dismiss(toastId);
    },
};
