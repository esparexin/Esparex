export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;
    public code?: string;
    public details?: unknown;

    constructor(message: string, statusCode: number, code?: string, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}
