import { EsparexError, ErrorCode, ErrorCategory, ErrorSeverity } from "./types";

export const createValidationError = (field: string, issue: string, value?: unknown): EsparexError => {
  const codeMap: Record<string, ErrorCode> = { required: ErrorCode.VALIDATION_REQUIRED_FIELD, email: ErrorCode.VALIDATION_INVALID_EMAIL, mobile: ErrorCode.VALIDATION_INVALID_MOBILE, url: ErrorCode.VALIDATION_INVALID_URL, gst: ErrorCode.VALIDATION_INVALID_GST, pincode: ErrorCode.VALIDATION_INVALID_PINCODE, minLength: ErrorCode.VALIDATION_MIN_LENGTH, maxLength: ErrorCode.VALIDATION_MAX_LENGTH, format: ErrorCode.VALIDATION_INVALID_FORMAT };
  return new EsparexError({ code: codeMap[issue] || ErrorCode.VALIDATION_INVALID_FORMAT, category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW, userMessage: `Please check the ${field} field: ${issue}`, technicalMessage: `Validation failed for field '${field}': ${issue}`, context: { field, issue, value }, recoverable: true, retryable: false, isExpected: true });
};

export const createFileUploadError = (reason: string, fileName?: string, fileSize?: number): EsparexError => {
  const messages: Record<string, { user: string; code: ErrorCode }> = {
    tooLarge: { user: "File is too large. Please use a smaller image (max 5MB).", code: ErrorCode.FILE_TOO_LARGE },
    invalidType: { user: "Invalid file type. Please upload an image (JPG, PNG, or WebP).", code: ErrorCode.FILE_INVALID_TYPE },
    corrupted: { user: "File appears to be corrupted. Please try a different image.", code: ErrorCode.FILE_CORRUPTED },
    readError: { user: "Could not read the file. Please try again.", code: ErrorCode.FILE_READ_ERROR },
    quotaExceeded: { user: "Storage limit exceeded. Please delete some images first.", code: ErrorCode.FILE_QUOTA_EXCEEDED },
  };
  const info = messages[reason] || { user: "Failed to upload file. Please try again.", code: ErrorCode.FILE_UPLOAD_FAILED };
  return new EsparexError({ code: info.code, category: ErrorCategory.FILE_UPLOAD, severity: ErrorSeverity.MEDIUM, userMessage: info.user, technicalMessage: `File upload failed: ${reason}`, context: { reason, fileName, fileSize }, recoverable: true, retryable: true });
};

export const createNetworkError = (operation: string, statusCode?: number, retryAfter?: number): EsparexError | null => {
  let code = ErrorCode.NETWORK_SERVER_ERROR;
  let userMessage = "Network error. Please check your connection and try again.";
  let severity = ErrorSeverity.MEDIUM;
  let isExpected = false;
  if (!navigator.onLine) { code = ErrorCode.NETWORK_OFFLINE; userMessage = "You appear to be offline. Please check your internet connection."; severity = ErrorSeverity.LOW; isExpected = true; }
  else if (statusCode === 401) { const a = createAuthError("sessionExpired"); if (!a) return null; return a; }
  else if (statusCode === 429) { code = ErrorCode.NETWORK_RATE_LIMIT; userMessage = retryAfter ? `Too many attempts. Try again after ${Math.ceil(retryAfter / 60)} min.` : "Too many attempts. Please try again later."; severity = ErrorSeverity.LOW; isExpected = true; }
  else if (statusCode === 404) { code = ErrorCode.NETWORK_NOT_FOUND; userMessage = "Resource not found. Please refresh the page."; severity = ErrorSeverity.LOW; isExpected = true; }
  else if (statusCode === 408) { code = ErrorCode.NETWORK_TIMEOUT; userMessage = "Request timed out. Please try again."; }
  else if (statusCode === 0) { code = ErrorCode.NETWORK_SERVER_ERROR; userMessage = "Unable to connect to the server. It may be offline."; severity = ErrorSeverity.LOW; isExpected = true; }
  else if (statusCode && statusCode >= 500) { code = ErrorCode.NETWORK_SERVER_ERROR; userMessage = "Server error. Our team has been notified. Please try again later."; severity = ErrorSeverity.HIGH; }
  return new EsparexError({ code, category: ErrorCategory.NETWORK, severity, userMessage, technicalMessage: `Network error during ${operation}: ${statusCode || "unknown"}`, context: { operation, statusCode, online: navigator.onLine, retryAfter }, recoverable: true, retryable: !isExpected, isExpected });
};

export const createDataError = (operation: "load" | "save", details?: string): EsparexError => {
  const isLoad = operation === "load";
  return new EsparexError({ code: isLoad ? ErrorCode.DATA_LOAD_FAILED : ErrorCode.DATA_SAVE_FAILED, category: ErrorCategory.DATA_LOAD, severity: ErrorSeverity.HIGH, userMessage: isLoad ? "Failed to load business data. Please refresh the page." : "Failed to save changes. Please try again.", technicalMessage: `Data ${operation} failed: ${details || "unknown error"}`, context: { operation, details }, recoverable: true, retryable: true });
};

export const createAuthError = (reason: string): EsparexError | null => {
  const messages: Record<string, { user: string; code: ErrorCode }> = {
    notLoggedIn: { user: "Please log in to continue.", code: ErrorCode.AUTH_NOT_LOGGED_IN },
    sessionExpired: { user: "Your session has expired. Please log in again.", code: ErrorCode.AUTH_SESSION_EXPIRED },
    notOwner: { user: "You don't have permission to edit this business.", code: ErrorCode.PERMISSION_NOT_OWNER },
  };
  if (reason === 'sessionExpired' || reason === 'notLoggedIn') return null;
  const info = messages[reason] || { user: "Authentication error. Please log in again.", code: ErrorCode.AUTH_NOT_LOGGED_IN };
  return new EsparexError({ code: info.code, category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH, userMessage: info.user, technicalMessage: `Authentication error: ${reason}`, context: { reason }, recoverable: true, retryable: false, isExpected: false });
};
