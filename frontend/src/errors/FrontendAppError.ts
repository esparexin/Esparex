export class FrontendAppError extends Error {
    code?: string;
    status?: number;
    details?: unknown;

    constructor(message: string, options?: { code?: string; status?: number; details?: unknown }) {
        super(message);
        this.name = "AppError";
        this.code = options?.code;
        this.status = options?.status;
        this.details = options?.details;
    }
}

export { FrontendAppError as AppError };
