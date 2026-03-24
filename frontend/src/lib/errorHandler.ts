/**
 * Comprehensive Error Handling Utility for Esparex
 * Production-grade error handling with logging, recovery, and user feedback
 */

// ============================================================================
// ERROR TYPES & CATEGORIES
// ============================================================================

export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  FILE_UPLOAD = "FILE_UPLOAD",
  DATA_LOAD = "DATA_LOAD",
  DATA_SAVE = "DATA_SAVE",
  AUTHENTICATION = "AUTHENTICATION",
  PERMISSION = "PERMISSION",
  SYSTEM = "SYSTEM",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorSeverity {
  LOW = "LOW",           // Minor issue, user can continue
  MEDIUM = "MEDIUM",     // Issue that affects functionality
  HIGH = "HIGH",         // Critical issue, blocks user action
  CRITICAL = "CRITICAL", // System-level failure
}

// ============================================================================
// ERROR CODES
// ============================================================================

export enum ErrorCode {
  // Validation Errors (1000-1999)
  VALIDATION_REQUIRED_FIELD = 1000,
  VALIDATION_INVALID_FORMAT = 1001,
  VALIDATION_MIN_LENGTH = 1002,
  VALIDATION_MAX_LENGTH = 1003,
  VALIDATION_INVALID_EMAIL = 1004,
  VALIDATION_INVALID_PHONE = 1005,
  VALIDATION_INVALID_URL = 1006,
  VALIDATION_INVALID_GST = 1007,
  VALIDATION_INVALID_PINCODE = 1008,
  VALIDATION_FILE_TOO_LARGE = 1009,
  VALIDATION_INVALID_FILE_TYPE = 1010,

  // Network Errors (2000-2999)
  NETWORK_OFFLINE = 2000,
  NETWORK_TIMEOUT = 2001,
  NETWORK_SERVER_ERROR = 2002,
  NETWORK_BAD_REQUEST = 2003,
  NETWORK_NOT_FOUND = 2004,
  NETWORK_RATE_LIMIT = 2005,

  // File Upload Errors (3000-3999)
  FILE_UPLOAD_FAILED = 3000,
  FILE_TOO_LARGE = 3001,
  FILE_INVALID_TYPE = 3002,
  FILE_CORRUPTED = 3003,
  FILE_QUOTA_EXCEEDED = 3004,
  FILE_READ_ERROR = 3005,

  // Data Errors (4000-4999)
  DATA_LOAD_FAILED = 4000,
  DATA_SAVE_FAILED = 4001,
  DATA_NOT_FOUND = 4002,
  DATA_CORRUPTED = 4003,
  DATA_SYNC_FAILED = 4004,
  DATA_PARSE_ERROR = 4005,

  // Auth & Permission Errors (5000-5999)
  AUTH_NOT_LOGGED_IN = 5000,
  AUTH_SESSION_EXPIRED = 5001,
  PERMISSION_DENIED = 5002,
  PERMISSION_NOT_OWNER = 5003,

  // System Errors (6000-6999)
  SYSTEM_STORAGE_FULL = 6000,
  SYSTEM_QUOTA_EXCEEDED = 6001,
  SYSTEM_BROWSER_NOT_SUPPORTED = 6002,

  // Unknown
  UNKNOWN_ERROR = 9999,
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class EsparexError extends Error {
  public readonly code: ErrorCode;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly isExpected: boolean;

  constructor({
    code,
    category,
    severity,
    userMessage,
    technicalMessage,
    context,
    recoverable = true,
    retryable = false,
    isExpected = false,
  }: {
    code: ErrorCode;
    category: ErrorCategory;
    severity: ErrorSeverity;
    userMessage: string;
    technicalMessage: string;
    context?: Record<string, unknown>;
    recoverable?: boolean;
    retryable?: boolean;
    isExpected?: boolean;
  }) {
    super(technicalMessage);
    this.name = "EsparexError";
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.timestamp = new Date();
    this.context = context;
    this.recoverable = recoverable;
    this.retryable = retryable;
    this.isExpected = isExpected;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      severity: this.severity,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      recoverable: this.recoverable,
      retryable: this.retryable,
      isExpected: this.isExpected,
    };
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

export const createValidationError = (
  field: string,
  issue: string,
  value?: unknown
): EsparexError => {
  const codeMap: Record<string, ErrorCode> = {
    required: ErrorCode.VALIDATION_REQUIRED_FIELD,
    email: ErrorCode.VALIDATION_INVALID_EMAIL,
    phone: ErrorCode.VALIDATION_INVALID_PHONE,
    url: ErrorCode.VALIDATION_INVALID_URL,
    gst: ErrorCode.VALIDATION_INVALID_GST,
    pincode: ErrorCode.VALIDATION_INVALID_PINCODE,
    minLength: ErrorCode.VALIDATION_MIN_LENGTH,
    maxLength: ErrorCode.VALIDATION_MAX_LENGTH,
    format: ErrorCode.VALIDATION_INVALID_FORMAT,
  };

  return new EsparexError({
    code: codeMap[issue] || ErrorCode.VALIDATION_INVALID_FORMAT,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: `Please check the ${field} field: ${issue}`,
    technicalMessage: `Validation failed for field '${field}': ${issue}`,
    context: { field, issue, value },
    recoverable: true,
    retryable: false,
    isExpected: true,
  });
};

export const createFileUploadError = (
  reason: string,
  fileName?: string,
  fileSize?: number
): EsparexError => {
  const messages: Record<string, { user: string; code: ErrorCode }> = {
    tooLarge: {
      user: "File is too large. Please use a smaller image (max 5MB).",
      code: ErrorCode.FILE_TOO_LARGE,
    },
    invalidType: {
      user: "Invalid file type. Please upload an image (JPG, PNG, or WebP).",
      code: ErrorCode.FILE_INVALID_TYPE,
    },
    corrupted: {
      user: "File appears to be corrupted. Please try a different image.",
      code: ErrorCode.FILE_CORRUPTED,
    },
    readError: {
      user: "Could not read the file. Please try again.",
      code: ErrorCode.FILE_READ_ERROR,
    },
    quotaExceeded: {
      user: "Storage limit exceeded. Please delete some images first.",
      code: ErrorCode.FILE_QUOTA_EXCEEDED,
    },
  };

  const errorInfo = messages[reason] || {
    user: "Failed to upload file. Please try again.",
    code: ErrorCode.FILE_UPLOAD_FAILED,
  };

  return new EsparexError({
    code: errorInfo.code,
    category: ErrorCategory.FILE_UPLOAD,
    severity: ErrorSeverity.MEDIUM,
    userMessage: errorInfo.user,
    technicalMessage: `File upload failed: ${reason}`,
    context: { reason, fileName, fileSize },
    recoverable: true,
    retryable: true,
  });
};

export const createNetworkError = (
  operation: string,
  statusCode?: number,
  retryAfter?: number
): EsparexError | null => {
  let code = ErrorCode.NETWORK_SERVER_ERROR;
  let userMessage = "Network error. Please check your connection and try again.";
  let severity = ErrorSeverity.MEDIUM;
  let isExpected = false;

  if (!navigator.onLine) {
    code = ErrorCode.NETWORK_OFFLINE;
    userMessage = "You appear to be offline. Please check your internet connection.";
    severity = ErrorSeverity.LOW;
    isExpected = true;
  } else if (statusCode === 401) {
    // 🔒 ARCHITECTURAL STANDARDS RULE: 
    // Authentication state is NOT an error. Expected 401 transitions return null.
    const authState = createAuthError("sessionExpired");
    if (!authState) return null;
    return authState;
  } else if (statusCode === 429) {
    code = ErrorCode.NETWORK_RATE_LIMIT;

    // Format retry time for user-friendly display
    if (retryAfter) {
      const minutes = Math.ceil(retryAfter / 60);
      userMessage = `Too many attempts. Try again after ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
    } else {
      userMessage = "Too many attempts. Please try again later.";
    }

    severity = ErrorSeverity.LOW; // Not fatal, just wait
    isExpected = true;
  } else if (statusCode === 404) {
    code = ErrorCode.NETWORK_NOT_FOUND;
    userMessage = "Resource not found. Please refresh the page.";
    severity = ErrorSeverity.LOW;
    isExpected = true;
  } else if (statusCode === 408) {
    code = ErrorCode.NETWORK_TIMEOUT;
    userMessage = "Request timed out. Please try again.";
  } else if (statusCode === 0) {
    code = ErrorCode.NETWORK_SERVER_ERROR;
    userMessage = "Unable to connect to the server. It may be offline.";
    severity = ErrorSeverity.LOW; // Backend restarting is expected during dev
    isExpected = true;
  } else if (statusCode && statusCode >= 500) {
    code = ErrorCode.NETWORK_SERVER_ERROR;
    userMessage = "Server error. Our team has been notified. Please try again later.";
    severity = ErrorSeverity.HIGH;
  }

  const statusText = statusCode === 0 ? "Connection Refused/Offline" : (statusCode || "unknown status");

  return new EsparexError({
    code,
    category: ErrorCategory.NETWORK,
    severity,
    userMessage,
    technicalMessage: `Network error during ${operation}: ${statusText}`,
    context: { operation, statusCode, online: navigator.onLine, retryAfter },
    recoverable: true,
    retryable: !isExpected, // Don't retry expected states like offline or 429
    isExpected,
  });
};

export const createDataError = (
  operation: "load" | "save",
  details?: string
): EsparexError => {
  const isLoad = operation === "load";

  return new EsparexError({
    code: isLoad ? ErrorCode.DATA_LOAD_FAILED : ErrorCode.DATA_SAVE_FAILED,
    category: ErrorCategory.DATA_LOAD,
    severity: ErrorSeverity.HIGH,
    userMessage: isLoad
      ? "Failed to load business data. Please refresh the page."
      : "Failed to save changes. Please try again.",
    technicalMessage: `Data ${operation} failed: ${details || "unknown error"}`,
    context: { operation, details },
    recoverable: true,
    retryable: true,
  });
};

export const createAuthError = (reason: string): EsparexError | null => {
  const messages: Record<string, { user: string; code: ErrorCode }> = {
    notLoggedIn: {
      user: "Please log in to continue.",
      code: ErrorCode.AUTH_NOT_LOGGED_IN,
    },
    sessionExpired: {
      user: "Your session has expired. Please log in again.",
      code: ErrorCode.AUTH_SESSION_EXPIRED,
    },
    notOwner: {
      user: "You don't have permission to edit this business.",
      code: ErrorCode.PERMISSION_NOT_OWNER,
    },
  };

  const errorInfo = messages[reason] || {
    user: "Authentication error. Please log in again.",
    code: ErrorCode.AUTH_NOT_LOGGED_IN,
  };

  // � ARCHITECTURAL STANDARDS RULE: 
  // Authentication state is NOT an error. Expected transitions (logged out / expired) return null.
  if (reason === 'sessionExpired' || reason === 'notLoggedIn') {
    return null; // Silent state transition
  }

  return new EsparexError({
    code: errorInfo.code,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: errorInfo.user,
    technicalMessage: `Authentication error: ${reason}`,
    context: { reason },
    recoverable: true,
    retryable: false,
    isExpected: false, // Permission denied etc are actual errors
  });
};

// ============================================================================
// ERROR LOGGER
// ============================================================================

class ErrorLogger {
  private logs: EsparexError[] = [];
  private maxLogs = 100;
  private seenErrors: Set<string> = new Set();

  log(error: EsparexError): void {
    // 1. Circuit Breaker: Prevent Duplicate Logs
    // Create a unique key for the error
    const errorKey = `${error.category}:${error.code}:${error.technicalMessage}`;

    // Check duplication (allow same error only once per 5 seconds?)
    // Or just once per session? User said "Same error can be logged only ONCE per render cycle"
    // Ideally we debounce.
    // Simple implementation: If in set, return. Clear set periodically?
    // Or just simple set for now to stop the flood.
    if (this.seenErrors.has(errorKey)) {
      return;
    }
    this.seenErrors.add(errorKey);
    // Auto-clear from seen set after 2 seconds to allow re-logging later if persistent
    setTimeout(() => this.seenErrors.delete(errorKey), 2000);

    this.logs.push(error);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for debugging
    try {
      const storedLogs = JSON.parse(
        localStorage.getItem("esparex_error_logs") || "[]"
      );
      storedLogs.push(error.toJSON());
      if (storedLogs.length > 50) storedLogs.shift();
      localStorage.setItem("esparex_error_logs", JSON.stringify(storedLogs));
    } catch {
      // Ignore storage errors
    }
  }

  getLogs(): EsparexError[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem("esparex_error_logs");
    } catch {
      // Ignore
    }
  }

  getLogsByCategory(category: ErrorCategory): EsparexError[] {
    return this.logs.filter((log) => log.category === category);
  }

  getLogsBySeverity(severity: ErrorSeverity): EsparexError[] {
    return this.logs.filter((log) => log.severity === severity);
  }
}

export const errorLogger = new ErrorLogger();

// ============================================================================
// ERROR HANDLER
// ============================================================================

export interface ErrorHandlerOptions {
  logError?: boolean;
  onError?: (error: EsparexError) => void;
  onRetry?: () => void;
  throwError?: boolean;
}

export const handleError = (
  error: Error | EsparexError | unknown,
  options: ErrorHandlerOptions = {}
): EsparexError | null => {
  // 🔒 ARCHITECTURAL STANDARDS RULE: 
  // If error is null, it means a silent state transition occurred. Exit immediately.
  if (error === null) return null;

  const {
    logError = true,
    onError,
    throwError = false,
  } = options;

  // Convert to EsparexError if needed
  let esparexError: EsparexError;

  if (error instanceof EsparexError) {
    esparexError = error;
  } else if (error instanceof Error) {
    esparexError = new EsparexError({
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      userMessage: "An unexpected error occurred. Please try again.",
      technicalMessage: error.message,
      context: { originalError: error.name, stack: error.stack },
      recoverable: true,
      retryable: true,
    });
  } else {
    esparexError = new EsparexError({
      code: ErrorCode.UNKNOWN_ERROR,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      userMessage: "An unexpected error occurred. Please try again.",
      technicalMessage: String(error),
      recoverable: true,
      retryable: true,
    });
  }

  // Log error
  if (logError) {
    errorLogger.log(esparexError);
  }

  // Call custom error handler
  if (onError) {
    onError(esparexError);
  }

  // Throw if requested
  if (throwError) {
    throw esparexError;
  }

  return esparexError;
};

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    return null;
  }
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number) => void;
}

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * attempt : delayMs;

        if (onRetry) {
          onRetry(attempt);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// ============================================================================
// FILE VALIDATION
// ============================================================================

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: EsparexError } => {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"],
  } = options;

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: createFileUploadError("tooLarge", file.name, file.size),
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(`.${ext}`)) {
      return {
        valid: false,
        error: createFileUploadError("invalidType", file.name),
      };
    }
  }

  return { valid: true };
};

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

export const sanitizeInput = (input: string, maxLength?: number): string => {
  let sanitized = input.trim();

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, "");

  // Limit length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

// ============================================================================
// ONLINE STATUS CHECK
// ============================================================================

export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

export const requireOnline = (operation: string): void => {
  if (!checkOnlineStatus()) {
    const error = createNetworkError(operation);
    if (error) {
      throw error;
    }
  }
};

// ============================================================================
// ERROR RECOVERY
// ============================================================================

export const createRecoveryAction = (
  error: EsparexError
): { text: string; action: () => void } | null => {
  switch (error.code) {
    case ErrorCode.NETWORK_OFFLINE:
      return {
        text: "Check Connection",
        action: () => window.location.reload(),
      };
    case ErrorCode.AUTH_NOT_LOGGED_IN:
    case ErrorCode.AUTH_SESSION_EXPIRED:
      return {
        text: "Log In",
        action: () => {
          // Navigate to login
          window.location.href = "/";
        },
      };
    case ErrorCode.DATA_LOAD_FAILED:
      return {
        text: "Refresh Page",
        action: () => window.location.reload(),
      };
    default:
      return error.retryable
        ? { text: "Try Again", action: () => { } }
        : null;
  }
};
