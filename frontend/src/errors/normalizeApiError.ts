import { FrontendAppError } from "./FrontendAppError";
import { isAPIError } from "@/lib/api/APIError";

export function normalizeApiError(error: unknown): FrontendAppError {
    if (error instanceof FrontendAppError) {
        return error;
    }

    if (isAPIError(error)) {
        return new FrontendAppError(error.message, {
            status: error.status,
            code: error.code,
            details: {
                source: error.source,
                retryAfter: error.retryAfter,
                details: error.details,
            },
        });
    }

    // Handle Axios-like errors
    if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
        const axiosError = error as any;
        const data = axiosError.response?.data;

        // Some APIs nest error details under data.error rather than data directly.
        const message = data?.error?.message || data?.message || axiosError.message || "A network error occurred";
        const status = data?.error?.status || axiosError.response?.status;
        const code = data?.error?.code || data?.code || axiosError.code;
        const details = data?.error?.details || data?.details || data;

        return new FrontendAppError(message, { status, code, details });
    }

    // Handle standard JS errors
    if (error instanceof Error) {
        return new FrontendAppError(error.message, { details: { name: error.name, stack: error.stack } });
    }

    // Handle bare strings
    if (typeof error === 'string') {
        return new FrontendAppError(error);
    }

    // Ultimate fallback
    return new FrontendAppError("An unknown error occurred", { details: error });
}
