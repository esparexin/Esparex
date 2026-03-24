import { EsparexError, ErrorCategory, ErrorSeverity } from "@/lib/errorHandler";

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

const fallbackError = (error: unknown): EsparexError => {
  if (error instanceof EsparexError) return error;
  const message = error instanceof Error ? error.message : "Unexpected API error";
  return new EsparexError({
    code: 9999,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    userMessage: message,
    technicalMessage: message,
    isExpected: false,
    retryable: false,
  });
};

export const unwrapApiPayload = <T>(response: unknown): T | null => {
  if (response === null || response === undefined) return null;

  const payload = (response as { data?: unknown })?.data ?? response;
  if (payload === null || payload === undefined) return null;
  if (typeof payload !== "object") return payload as T;

  const record = payload as Record<string, unknown>;
  const nestedData = record.data;

  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    if ("data" in nestedRecord) {
      return nestedRecord.data as T;
    }
  }

  if ("data" in record) {
    const dataField = record.data;
    if (dataField && typeof dataField === "object" && "items" in (dataField as any)) {
      return (dataField as any).items as T;
    }
    return dataField as T;
  }

  if ("items" in record) {
    return record.items as T;
  }

  if (record.output && typeof record.output === "object") {
    const outputRecord = record.output as Record<string, unknown>;
    if ("data" in outputRecord) return outputRecord.data as T;
    return record.output as T;
  }

  return payload as T;
};

const unwrapPagination = (response: unknown): PaginationEnvelope => {
  if (!response || typeof response !== "object") {
    return { page: 1, limit: 0, total: 0, totalPages: 0, hasMore: false };
  }

  const record = response as Record<string, unknown>;
  const nestedData = record.data;
  const rootPagination =
    record.pagination && typeof record.pagination === "object"
      ? (record.pagination as PaginationEnvelope)
      : null;

  const nestedPagination =
    nestedData &&
      typeof nestedData === "object" &&
      (nestedData as Record<string, unknown>).pagination &&
      typeof (nestedData as Record<string, unknown>).pagination === "object"
      ? ((nestedData as Record<string, unknown>).pagination as PaginationEnvelope)
      : null;

  const pagination = nestedPagination || rootPagination;
  if (!pagination) {
    return { page: 1, limit: 0, total: 0, totalPages: 0, hasMore: false };
  }

  return {
    page: Number(pagination.page || 1),
    limit: Number(pagination.limit || 0),
    total:
      typeof pagination.total === "number" ? pagination.total : undefined,
    totalPages:
      typeof pagination.totalPages === "number" ? pagination.totalPages : undefined,
    hasMore:
      typeof pagination.hasMore === "boolean" ? pagination.hasMore : undefined,
    cursor: typeof pagination.cursor === "string" || pagination.cursor === null ? pagination.cursor : undefined,
    nextCursor:
      typeof pagination.nextCursor === "string" ? pagination.nextCursor : undefined,
  };
};

export const toApiResult = async <T>(apiCall: Promise<unknown>): Promise<ApiResult<T>> => {
  try {
    const response = await apiCall;
    return { data: unwrapApiPayload<T>(response), error: null };
  } catch (error) {
    const normalized = fallbackError(error);
    return {
      data: null,
      error: normalized,
      statusCode:
        (normalized.context as { statusCode?: number } | undefined)?.statusCode ??
        (normalized as unknown as { response?: { status?: number } })?.response?.status,
    };
  }
};

export const toPaginatedApiResult = async <T>(
  apiCall: Promise<unknown>
): Promise<ApiResult<PaginatedApiResult<T>>> => {
  try {
    const response = await apiCall;
    const data = unwrapApiPayload<T[] | { data?: T[] }>(response);
    const arrayData = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { data?: T[] }).data)
        ? ((data as { data: T[] }).data || [])
        : [];

    return {
      data: {
        data: arrayData,
        pagination: unwrapPagination(response),
      },
      error: null,
    };
  } catch (error) {
    const normalized = fallbackError(error);
    return {
      data: null,
      error: normalized,
      statusCode:
        (normalized.context as { statusCode?: number } | undefined)?.statusCode ??
        (normalized as unknown as { response?: { status?: number } })?.response?.status,
    };
  }
};
