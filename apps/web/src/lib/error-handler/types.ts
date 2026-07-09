export enum ErrorCategory {
  VALIDATION = "VALIDATION", NETWORK = "NETWORK", FILE_UPLOAD = "FILE_UPLOAD",
  DATA_LOAD = "DATA_LOAD", DATA_SAVE = "DATA_SAVE", AUTHENTICATION = "AUTHENTICATION",
  PERMISSION = "PERMISSION", SYSTEM = "SYSTEM", BUSINESS_LOGIC = "BUSINESS_LOGIC", UNKNOWN = "UNKNOWN",
}

export enum ErrorSeverity {
  LOW = "LOW", MEDIUM = "MEDIUM", HIGH = "HIGH", CRITICAL = "CRITICAL",
}

export enum ErrorCode {
  VALIDATION_REQUIRED_FIELD = 1000, VALIDATION_INVALID_FORMAT = 1001, VALIDATION_MIN_LENGTH = 1002,
  VALIDATION_MAX_LENGTH = 1003, VALIDATION_INVALID_EMAIL = 1004, VALIDATION_INVALID_MOBILE = 1005,
  VALIDATION_INVALID_URL = 1006, VALIDATION_INVALID_GST = 1007, VALIDATION_INVALID_PINCODE = 1008,
  VALIDATION_FILE_TOO_LARGE = 1009, VALIDATION_INVALID_FILE_TYPE = 1010,
  NETWORK_OFFLINE = 2000, NETWORK_TIMEOUT = 2001, NETWORK_SERVER_ERROR = 2002, NETWORK_BAD_REQUEST = 2003,
  NETWORK_NOT_FOUND = 2004, NETWORK_RATE_LIMIT = 2005,
  FILE_UPLOAD_FAILED = 3000, FILE_TOO_LARGE = 3001, FILE_INVALID_TYPE = 3002, FILE_CORRUPTED = 3003,
  FILE_QUOTA_EXCEEDED = 3004, FILE_READ_ERROR = 3005,
  DATA_LOAD_FAILED = 4000, DATA_SAVE_FAILED = 4001, DATA_NOT_FOUND = 4002, DATA_CORRUPTED = 4003,
  DATA_SYNC_FAILED = 4004, DATA_PARSE_ERROR = 4005,
  AUTH_NOT_LOGGED_IN = 5000, AUTH_SESSION_EXPIRED = 5001, PERMISSION_DENIED = 5002, PERMISSION_NOT_OWNER = 5003,
  SYSTEM_STORAGE_FULL = 6000, SYSTEM_QUOTA_EXCEEDED = 6001, SYSTEM_BROWSER_NOT_SUPPORTED = 6002,
  UNKNOWN_ERROR = 9999,
}

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

  constructor(params: {
    code: ErrorCode; category: ErrorCategory; severity: ErrorSeverity; userMessage: string; technicalMessage: string;
    context?: Record<string, unknown>; recoverable?: boolean; retryable?: boolean; isExpected?: boolean;
  }) {
    super(params.technicalMessage);
    this.name = "EsparexError";
    this.code = params.code; this.category = params.category; this.severity = params.severity;
    this.userMessage = params.userMessage; this.technicalMessage = params.technicalMessage;
    this.timestamp = new Date(); this.context = params.context;
    this.recoverable = params.recoverable ?? true; this.retryable = params.retryable ?? false; this.isExpected = params.isExpected ?? false;
  }

  toJSON() { return { name: this.name, code: this.code, category: this.category, severity: this.severity, userMessage: this.userMessage, technicalMessage: this.technicalMessage, timestamp: this.timestamp.toISOString(), context: this.context, recoverable: this.recoverable, retryable: this.retryable, isExpected: this.isExpected }; }
}
