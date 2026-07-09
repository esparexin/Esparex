import { EsparexError, ErrorCode, ErrorCategory, ErrorSeverity } from "./types";
import { errorLogger } from "./logger";

export interface ErrorHandlerOptions { logError?: boolean; onError?: (error: EsparexError) => void; onRetry?: () => void; throwError?: boolean; }

export const handleError = (error: Error | EsparexError | unknown, options: ErrorHandlerOptions = {}): EsparexError | null => {
  if (error === undefined) return null;
  const { logError = true, onError, throwError = false } = options;
  let ee: EsparexError;
  if (error instanceof EsparexError) ee = error;
  else if (error instanceof Error) ee = new EsparexError({ code: ErrorCode.UNKNOWN_ERROR, category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM, userMessage: "An unexpected error occurred.", technicalMessage: error.message, context: { originalError: error.name, stack: error.stack }, recoverable: true, retryable: true });
  else ee = new EsparexError({ code: ErrorCode.UNKNOWN_ERROR, category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM, userMessage: "An unexpected error occurred.", technicalMessage: String(error), recoverable: true, retryable: true });
  if (logError) errorLogger.log(ee);
  if (onError) onError(ee);
  if (throwError) throw ee;
  return ee;
};

export const withErrorHandling = async <T>(fn: () => Promise<T>, options: ErrorHandlerOptions = {}): Promise<T | null> => {
  try { return await fn(); }
  catch (error) { handleError(error, options); return null; }
};

export interface RetryOptions { maxAttempts?: number; delayMs?: number; backoff?: boolean; onRetry?: (attempt: number) => void; }

export const retryAsync = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const { maxAttempts = 3, delayMs = 1000, backoff = true, onRetry } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); }
    catch (error) { lastError = error; if (attempt < maxAttempts) { const delay = backoff ? delayMs * attempt : delayMs; if (onRetry) onRetry(attempt); await new Promise((r) => setTimeout(r, delay)); } }
  }
  throw lastError;
};
