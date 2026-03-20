export type APIErrorSource = "backend" | "network" | "health-gate";

export interface APIErrorShape {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
  retryAfter?: number;
  source: APIErrorSource;
}

type APIErrorContext = {
  statusCode?: number;
  backendErrorCode?: string;
  backendErrorMessage?: string;
  retryAfter?: number;
  endpoint?: string;
};

export class APIError extends Error implements APIErrorShape {
  status: number;
  code?: string;
  details?: unknown;
  retryAfter?: number;
  source: APIErrorSource;

  // Compatibility fields for existing hooks/components during the transition.
  userMessage: string;
  response?: { status: number; data?: unknown };
  context?: APIErrorContext;

  constructor({
    status,
    code,
    message,
    details,
    retryAfter,
    source,
    responseData,
    context,
  }: APIErrorShape & {
    responseData?: unknown;
    context?: APIErrorContext;
  }) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
    this.source = source;
    this.userMessage = message;

    if (status > 0 || responseData !== undefined) {
      this.response = { status, data: responseData };
    }

    const mergedContext: APIErrorContext = {
      statusCode: status || undefined,
      retryAfter,
      ...context,
    };
    if (Object.values(mergedContext).some((value) => value !== undefined)) {
      this.context = mergedContext;
    }
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      retryAfter: this.retryAfter,
      source: this.source,
    };
  }
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}
