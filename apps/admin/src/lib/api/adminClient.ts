import type { AdminEnvelope } from "@/types/admin";
import {
  ADMIN_ROUTES,
} from "@/lib/api/routes";
import { resolveValidatedAdminApiBase } from "@/lib/api/validateAdminApiEnv";

const ADMIN_API_BASE = resolveValidatedAdminApiBase();

const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_ADMIN_API_TIMEOUT_MS || 20000);

/**
 * Maximum number of network-level retries per request.
 * Covers transient failures (dropped connection, DNS hiccup).
 * Does NOT retry on 4xx/5xx HTTP responses — those are handled by callers.
 * Exported so tests and alternate fetch strategies can reference it.
 */
export const ADMIN_MAX_RETRIES = 1;

let inMemoryAdminAccessToken: string | null = typeof window !== "undefined" ? window.localStorage.getItem("esparex_admin_token") : null;

export const getAdminApiBase = (): string => ADMIN_API_BASE;

export const setAdminAccessToken = (token: string | null | undefined) => {
  const normalized = typeof token === "string" ? token.trim() : "";
  inMemoryAdminAccessToken = normalized.length > 0 ? normalized : null;
  if (typeof window !== "undefined") {
    if (inMemoryAdminAccessToken) {
      window.localStorage.setItem("esparex_admin_token", inMemoryAdminAccessToken);
    } else {
      window.localStorage.removeItem("esparex_admin_token");
    }
  }
};

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0
    ? REQUEST_TIMEOUT_MS
    : 20000;
  let timedOut = false;

  const parentSignal = init.signal;
  const abortFromParent = () => controller.abort();

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", abortFromParent, { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      const seconds = Math.max(1, Math.round(timeoutMs / 1000));
      throw new Error(`Request timed out after ${seconds}s. Please try again.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (parentSignal) {
      parentSignal.removeEventListener("abort", abortFromParent);
    }
  }
}

let cachedCsrfToken: string | null = null;

/** Clears the CSRF token cache so the next state-changing request fetches a fresh one. */
function invalidateCsrfCache(): void {
  cachedCsrfToken = null;
}

export async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  const response = await fetchWithTimeout(`${ADMIN_API_BASE}${ADMIN_ROUTES.CSRF_TOKEN}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`CSRF token request failed (${response.status})`);
  }

  const data = await response.json();
  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
    return data.csrfToken;
  }
  throw new Error("Failed to get CSRF token");
}

/**
 * Serialises the request body to a BodyInit-compatible value.
 * - FormData passes through unchanged (browser sets multipart boundary).
 * - undefined passes through unchanged (no body).
 * - Everything else is JSON-serialised to a string.
 *
 * Replaces the silent `as BodyInit | undefined` cast with an explicit, typed path.
 */
function serializeBody(body: unknown, isFormData: boolean): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (isFormData) return body as FormData;
  return JSON.stringify(body);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class AdminApiError<T = unknown> extends Error {
  status: number;
  payload: AdminEnvelope<T>;

  constructor(message: string, status: number, payload: AdminEnvelope<T>) {
    super(message);
    this.status = status;
    this.payload = payload;
  }

  /**
   * Resolves a human-readable message from a standardized Admin error payload.
   *
   * Resolution priority (matches SSOT backend envelope schema):
   *   1. Nested object  — payload.error.message       (backend DDD errors)
   *   2. Validation arr — payload.details[0].message  (Zod / class-validator)
   *   3. Simple strings — payload.message | payload.error | error.message
   *   4. Fallback       — caller-supplied string
   *
   * Accepts any thrown value — handles AdminApiError, Error, string, and
   * unknown values safely so callers never need to pre-check the type.
   */
  static resolveMessage(error: unknown, fallback: string): string {
    if (error instanceof AdminApiError) {
      return AdminApiError._resolveFromPayload(error.payload, error.message, fallback);
    }
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : fallback;
  }

  /**
   * Extracts the best available message from a raw AdminEnvelope payload.
   * Private — external callers must go through resolveMessage().
   */
  private static _resolveFromPayload<T>(
    payload: AdminEnvelope<T>,
    errorMessage: string,
    fallback: string,
  ): string {
    // 1. Nested object: { error: { message: string } }
    if (
      payload.error &&
      typeof payload.error === 'object' &&
      typeof (payload.error as Record<string, unknown>).message === 'string'
    ) {
      return String((payload.error as Record<string, unknown>).message);
    }

    // 2. Validation array: { details: [{ message: string }, ...] }
    if (Array.isArray(payload.details)) {
      const first = payload.details.find(
        (d: unknown): d is Record<string, unknown> =>
          typeof d === 'object' && d !== null &&
          typeof (d as Record<string, unknown>).message === 'string'
      );
      if (first) return String(first.message);
    }

    // 3. Simple scalar fields
    return String(
      payload.message ||
      (typeof payload.error === 'string' ? payload.error : undefined) ||
      errorMessage ||
      fallback,
    );
  }
}

/**
 * Custom error for network-level failures (no HTTP response received).
 * Distinguishable from AdminApiError so callers can decide whether to
 * preserve session state (network blip) vs. clear it (auth failure).
 */
export class AdminNetworkError extends Error {
  originalError: unknown;
  constructor(message: string, originalError: unknown) {
    super(message);
    this.name = "AdminNetworkError";
    this.originalError = originalError;
  }
}

// ---------------------------------------------------------------------------
// Core request executor — module-level so it is testable in isolation.
// Handles header construction, CSRF, timeout, retry, and error classification.
// ---------------------------------------------------------------------------

type RequestContext<T> = {
  path: string;
  options: RequestOptions;
  csrfRetry: boolean;
  retryCount: number;
};

async function executeAdminRequest<T>(ctx: RequestContext<T>): Promise<AdminEnvelope<T>> {
  const { path, options, csrfRetry, retryCount } = ctx;

  try {
    const url = `${ADMIN_API_BASE}${path}`;
    const headers = new Headers(options.headers || {});
    const isFormDataBody = options.body instanceof FormData;

    if (!isFormDataBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    } else if (isFormDataBody && headers.has("Content-Type")) {
      // Let the browser set the correct multipart boundary automatically
      headers.delete("Content-Type");
    }

    if (inMemoryAdminAccessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${inMemoryAdminAccessToken}`);
    }

    // Attach CSRF token for state-changing requests (POST / PUT / PATCH / DELETE)
    const isStateChangingRequest =
      options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase());
    if (isStateChangingRequest) {
      try {
        if (csrfRetry) invalidateCsrfCache();
        const token = await fetchCsrfToken();
        headers.set("x-csrf-token", token);
      } catch {
        // CSRF fetch failed — clear cache so the next request retries fresh
        invalidateCsrfCache();
      }
    }

    const response = await fetchWithTimeout(url, {
      method: options.method || "GET",
      credentials: "include",
      cache: "no-store",
      ...options,
      headers,
      body: serializeBody(options.body, isFormDataBody),
    });

    const payload = (await response.json().catch(() => ({}))) as AdminEnvelope<T>;

    if (!response.ok) {
      if (response.status === 401) {
        setAdminAccessToken(null);
      }

      const errorText = `${payload.message || ""} ${payload.error || ""}`.toLowerCase();
      const isCsrfError = response.status === 403 && errorText.includes("csrf");
      if (isCsrfError && isStateChangingRequest && !csrfRetry) {
        invalidateCsrfCache();
        return executeAdminRequest({ path, options, csrfRetry: true, retryCount });
      }
      if (isCsrfError) {
        // Clear cache on CSRF errors to force refresh next time
        invalidateCsrfCache();
      }

      const details =
        payload.details && typeof payload.details === "object"
          ? (payload.details as { message?: unknown })
          : undefined;
      const detailsMessage = typeof details?.message === "string" ? details.message : undefined;

      // Extract nested error message for the Error constructor (fallback used in resolveMessage)
      const nestedErrorMessage =
        payload.error && typeof payload.error === 'object'
          ? String((payload.error as Record<string, unknown>).message)
          : undefined;

      const message =
        payload.message ||
        nestedErrorMessage ||
        (typeof payload.error === 'string' ? payload.error : undefined) ||
        detailsMessage ||
        `Request failed (${response.status})`;

      const error = new AdminApiError(String(message), response.status, payload);

      // Only surface 5xx — 4xx are expected business responses handled by callers
      if (response.status >= 500) {
        // eslint-disable-next-line no-console -- infrastructure boundary: 5xx errors are surfaced for observability
        console.error("[API ERROR]", message);
      }

      throw error;
    }

    return payload;
  } catch (err) {
    if (err instanceof AdminApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') throw err;

    // Normalize message to lowercase: browsers throw "Failed to fetch" (capital F)
    // but the string check must be case-insensitive to match all environments.
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    const isNetworkError =
      err instanceof Error &&
      (err.name === 'TypeError' ||
        msg.includes('failed to fetch') ||
        msg.includes('timeout') ||
        msg.includes('networkerror'));

    if (isNetworkError && retryCount < ADMIN_MAX_RETRIES) {
      // eslint-disable-next-line no-console -- infrastructure boundary: retry attempts are surfaced for debugging
      console.warn(`[API RETRY] Attempt ${retryCount + 1} for: ${path}`);
      return executeAdminRequest({ path, options, csrfRetry, retryCount: retryCount + 1 });
    }

    const message = err instanceof Error ? err.message : "Unable to connect to server.";
    const networkError = new AdminNetworkError(message, err);
    // eslint-disable-next-line no-console -- infrastructure boundary: network failures are surfaced for observability
    console.error("[API ERROR]", message);
    throw networkError;
  }
}

export async function adminFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<AdminEnvelope<T>> {
  return executeAdminRequest<T>({ path, options, csrfRetry: false, retryCount: 0 });
}
