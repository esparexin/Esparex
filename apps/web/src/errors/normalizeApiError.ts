import { FrontendAppError } from "./FrontendAppError";
import { isAPIError } from "@/lib/api/APIError";

interface AxiosLikeError {
    isAxiosError: boolean;
    message: string;
    code?: string;
    response?: {
        status: number;
        data?: {
            message?: string;
            code?: string;
            details?: unknown;
            error?: {
                message?: string;
                status?: number;
                code?: string;
                details?: unknown;
            };
        };
    };
}

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
        const axiosError = error as unknown as AxiosLikeError;
        const data = axiosError.response?.data;

        // Some APIs nest error details under data.error (string or object) rather than data directly.
        const errorField = data?.error;
        const stringError = typeof errorField === 'string' ? errorField : undefined;
        const objectError = typeof errorField === 'object' && errorField !== null ? errorField as Record<string, unknown> : undefined;

        const message = objectError?.message as string || stringError || data?.message || axiosError.message || "A network error occurred";
        const status = (objectError?.status as number) || axiosError.response?.status;
        const code = (objectError?.code as string) || data?.code || axiosError.code;
        const details = objectError?.details || data?.details || data;

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
