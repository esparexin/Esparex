import { isAPIError, type APIError } from "@/lib/api/APIError";
import { EsparexError, ErrorCategory, ErrorCode, ErrorSeverity } from "@/lib/errorHandler";

export interface ApiResult<T> {
  data: T | null;
  error: EsparexError | null;
  statusCode?: number;
}

export interface PaginationEnvelope {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
  cursor?: string | null;
  nextCursor?: string;
}

interface PaginatedApiResult<T> {
  data: T[];
  pagination: PaginationEnvelope;
}

function getApiErrorStatus(error: APIError): number {
  return error.status || error.response?.status || error.context?.statusCode || 0;
}

function getApiErrorCode(error: APIError, statusCode: number): ErrorCode {
  if (error.source === "network" || error.source === "health-gate") {
    if (statusCode === 408) return ErrorCode.NETWORK_TIMEOUT;
    if (statusCode === 429) return ErrorCode.NETWORK_RATE_LIMIT;
    if (statusCode === 404) return ErrorCode.NETWORK_NOT_FOUND;
    return ErrorCode.NETWORK_SERVER_ERROR;
  }

  if (statusCode === 401) return ErrorCode.AUTH_SESSION_EXPIRED;
  if (statusCode === 403) return ErrorCode.PERMISSION_DENIED;
  if (statusCode === 404) return ErrorCode.DATA_NOT_FOUND;
  if (statusCode === 429) return ErrorCode.NETWORK_RATE_LIMIT;
  if (statusCode >= 500) return ErrorCode.NETWORK_SERVER_ERROR;

  return ErrorCode.UNKNOWN_ERROR;
}

function getApiErrorCategory(error: APIError, statusCode: number): ErrorCategory {
  if (error.source === "network" || error.source === "health-gate") {
    return ErrorCategory.NETWORK;
  }

  if (statusCode === 401) return ErrorCategory.AUTHENTICATION;
  if (statusCode === 403) return ErrorCategory.PERMISSION;
  if (statusCode === 404) return ErrorCategory.DATA_LOAD;
  if (statusCode >= 500) return ErrorCategory.SYSTEM;

  return ErrorCategory.BUSINESS_LOGIC;
}

function getApiErrorSeverity(error: APIError, statusCode: number): ErrorSeverity {
  if (error.source === "health-gate") return ErrorSeverity.MEDIUM;
  if (error.source === "network") {
    return statusCode === 0 || statusCode === 408 ? ErrorSeverity.LOW : ErrorSeverity.MEDIUM;
  }

  if (statusCode >= 500) return ErrorSeverity.HIGH;
  if (statusCode === 401 || statusCode === 403 || statusCode === 429) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}

function isApiErrorRetryable(error: APIError, statusCode: number): boolean {
  return error.source === "network" || error.source === "health-gate" || statusCode === 408 || statusCode === 429 || statusCode >= 500;
}

function isExpectedApiError(error: APIError, statusCode: number): boolean {
  if (error.source === "health-gate") return true;
  if (error.source === "network" && statusCode === 0) return true;
  return statusCode > 0 && statusCode < 500 && statusCode !== 408;
}

function toEsparexApiError(error: APIError): EsparexError {
  const statusCode = getApiErrorStatus(error);
  const endpoint = error.context?.endpoint;
  const backendErrorCode = error.context?.backendErrorCode ?? error.code;
  const backendErrorMessage = error.context?.backendErrorMessage ?? error.message;
  const retryAfter = error.retryAfter ?? error.context?.retryAfter;

  return new EsparexError({
    code: getApiErrorCode(error, statusCode),
    category: getApiErrorCategory(error, statusCode),
    severity: getApiErrorSeverity(error, statusCode),
    userMessage: error.userMessage || error.message,
    technicalMessage: [
      `API ${error.source} error`,
      endpoint ? `at ${endpoint}` : null,
      statusCode ? `(status ${statusCode})` : "(status 0)",
      backendErrorCode ? `[${backendErrorCode}]` : null,
      error.message,
    ].filter(Boolean).join(" "),
    context: {
      statusCode,
      source: error.source,
      endpoint,
      retryAfter,
      backendErrorCode,
      backendErrorMessage,
      details: error.details,
    },
    recoverable: true,
    retryable: isApiErrorRetryable(error, statusCode),
    isExpected: isExpectedApiError(error, statusCode),
  });
}

const fallbackError = (error: unknown): EsparexError => {
  if (error instanceof EsparexError) return error;
  if (isAPIError(error)) return toEsparexApiError(error);
  const message = error instanceof Error ? error.message : "Unexpected API error";
  return new EsparexError({
    code: ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    userMessage: message,
    technicalMessage: message,
    context: error instanceof Error ? { name: error.name, stack: error.stack } : undefined,
    isExpected: false,
    retryable: false,
  });
};

export const createApiErrorResult = (error: unknown) => {
  const normalized = fallbackError(error);
  const responseStatus =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;

  return {
    data: null,
    error: normalized,
    statusCode:
      (normalized.context as { statusCode?: number } | undefined)?.statusCode ?? responseStatus,
  };
};

export const unwrapApiPayload = <T>(response: unknown): T | null => {
  if (response === undefined || response === undefined) return null;

  // 1. Handle Axios response object or direct envelope
  const payload = (response as { data?: unknown })?.data ?? response;
  if (payload === undefined || payload === undefined) return null;
  if (typeof payload !== "object") return payload as T;

  const record = payload as Record<string, unknown>;

  // 2. SSOT: Standardized ApiResponse envelope { success, data, message }
  // Only unwrap 'data' if 'success' is explicitly true, to ensure we don't 
  // mistakenly unwrap an error payload that happens to have a 'data' field.
  if (record.success === true && "data" in record) {
    return record.data as T;
  }

  // 3. Fallback: Legacy payload structures (to be deprecated)
  if (record.items && Array.isArray(record.items)) {
    return record.items as T;
  }

  if (record.output && typeof record.output === "object") {
    const outputRecord = record.output as Record<string, unknown>;
    return (outputRecord.data ?? record.output) as T;
  }

  // 4. Return raw payload if no standard envelope-like keys found
  return payload as T;
};

const extractPaginationObject = (obj: unknown, depth = 0): PaginationEnvelope | null => {
  if (!obj || typeof obj !== "object" || depth > 4) return null;
  const rec = obj as Record<string, unknown>;

  // Direct pagination property
  if (rec.pagination && typeof rec.pagination === "object") {
    return rec.pagination as PaginationEnvelope;
  }

  // Direct pagination envelope
  if (typeof rec.total === "number" && typeof rec.page === "number") {
    return {
      page: rec.page,
      limit: typeof rec.limit === "number" ? rec.limit : 0,
      total: rec.total,
      totalPages: typeof rec.totalPages === "number" ? rec.totalPages : undefined,
      hasMore: typeof rec.hasMore === "boolean" ? rec.hasMore : undefined,
      cursor: typeof rec.cursor === "string" ? rec.cursor : undefined,
      nextCursor: typeof rec.nextCursor === "string" ? rec.nextCursor : undefined,
    };
  }

  // Nested in data
  if (rec.data && typeof rec.data === "object") {
    const fromData = extractPaginationObject(rec.data, depth + 1);
    if (fromData) return fromData;
  }

  // Nested in output
  if (rec.output && typeof rec.output === "object") {
    const fromOutput = extractPaginationObject(rec.output, depth + 1);
    if (fromOutput) return fromOutput;
  }

  return null;
};

const unwrapPagination = (response: unknown): PaginationEnvelope => {
  const pagination = extractPaginationObject(response);
  if (!pagination) {
    return { page: 1, limit: 0, total: 0, totalPages: 0, hasMore: false };
  }

  const page = Number(pagination.page || 1);
  const limit = Number(pagination.limit || 0);
  const total = typeof pagination.total === "number" ? pagination.total : undefined;
  const totalPages =
    typeof pagination.totalPages === "number"
      ? pagination.totalPages
      : (typeof total === "number" && limit > 0 ? Math.ceil(total / limit) : undefined);
  const hasMore =
    typeof pagination.hasMore === "boolean"
      ? pagination.hasMore
      : (typeof totalPages === "number" ? page < totalPages : undefined);

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
    cursor: typeof pagination.cursor === "string" || pagination.cursor === undefined ? pagination.cursor : undefined,
    nextCursor:
      typeof pagination.nextCursor === "string" ? pagination.nextCursor : undefined,
  };
};

export const toApiResult = async <T>(apiCall: Promise<unknown>): Promise<ApiResult<T>> => {
  try {
    const response = await apiCall;
    return { data: unwrapApiPayload<T>(response), error: null };
  } catch (error) {
    return createApiErrorResult(error);
  }
};

export const toPaginatedApiResult = async <T>(
  apiCall: Promise<unknown>
): Promise<ApiResult<PaginatedApiResult<T>>> => {
  try {
    const response = await apiCall;
    const data = unwrapApiPayload<T[] | { data?: T[]; items?: T[]; pagination?: PaginationEnvelope }>(response);
    const arrayData = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { data?: T[] }).data)
        ? ((data as { data: T[] }).data || [])
        : data && typeof data === "object" && Array.isArray((data as { items?: T[] }).items)
          ? ((data as { items: T[] }).items || [])
        : [];

    const pagination = extractPaginationObject(response)
      ? unwrapPagination(response)
      : unwrapPagination(data);

    return {
      data: {
        data: arrayData,
        pagination,
      },
      error: null,
    };
  } catch (error) {
    return createApiErrorResult(error);
  }
};
