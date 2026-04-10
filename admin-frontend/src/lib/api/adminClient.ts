import type { AdminEnvelope } from "@/types/admin";
import {
  ADMIN_ROUTES,
} from "@/lib/api/routes";
import { emitAdminErrorPopup } from "@/lib/popup/popupEvents";
import { resolveValidatedAdminApiBase } from "@/lib/api/validateAdminApiEnv";

const ADMIN_API_BASE = resolveValidatedAdminApiBase();

const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_ADMIN_API_TIMEOUT_MS || 20000);
let inMemoryAdminAccessToken: string | null = null;

export const getAdminApiBase = (): string => ADMIN_API_BASE;

export const setAdminAccessToken = (token: string | null | undefined) => {
  const normalized = typeof token === "string" ? token.trim() : "";
  inMemoryAdminAccessToken = normalized.length > 0 ? normalized : null;
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

async function fetchCsrfToken(): Promise<string> {
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
   * Handles nested { error: { message } } schema (SSOT) and simple { message } or { error } strings.
   */
  static resolveMessage(error: unknown, fallback: string): string {
    if (error instanceof AdminApiError) {
      const payload = error.payload as any;
      
      // 1. Check SSOT nested object: { error: { message } }
      if (payload.error && typeof payload.error === 'object' && typeof payload.error.message === 'string') {
        return payload.error.message;
      }
      
      // 2. Check details if array (validation issues): { details: [{ message }] }
      if (Array.isArray(payload.details)) {
        const first = payload.details.find((d: any) => typeof d?.message === 'string');
        if (first) return first.message;
      }

      // 3. Fallback to simple string properties
      return payload.message || payload.error || error.message || fallback;
    }

    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : fallback;
  }
}

export async function adminFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<AdminEnvelope<T>> {
  const makeRequest = async (csrfRetry: boolean): Promise<AdminEnvelope<T>> => {
    const url = `${ADMIN_API_BASE}${path}`;
    const headers = new Headers(options.headers || {});
    const isFormDataBody = options.body instanceof FormData;

    if (!isFormDataBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    } else if (isFormDataBody && headers.has("Content-Type")) {
      headers.delete("Content-Type");
    }

    if (inMemoryAdminAccessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${inMemoryAdminAccessToken}`);
    }

    // Include CSRF token for state-changing requests
    const isStateChangingRequest = options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase());
    if (isStateChangingRequest) {
      try {
        if (csrfRetry) {
          cachedCsrfToken = null;
        }
        const token = await fetchCsrfToken();
        headers.set("x-csrf-token", token);
      } catch {
        // In case of error (e.g. initial request), we clear cache to retry later
        cachedCsrfToken = null;
      }
    }

    const response = await fetchWithTimeout(url, {
      method: options.method || "GET",
      credentials: "include",
      cache: "no-store",
      ...options,
      headers,
      body:
        options.body === undefined || isFormDataBody
          ? (options.body as BodyInit | undefined)
          : JSON.stringify(options.body)
    });

    const payload = (await response.json().catch(() => ({}))) as AdminEnvelope<T>;

    if (!response.ok) {
      if (response.status === 401) {
        inMemoryAdminAccessToken = null;
      }

      const errorText = `${payload.message || ""} ${payload.error || ""}`.toLowerCase();
      const isCsrfError = response.status === 403 && errorText.includes("csrf");
      if (isCsrfError && isStateChangingRequest && !csrfRetry) {
        cachedCsrfToken = null;
        return makeRequest(true);
      }
      if (isCsrfError) {
        // Clear cache on CSRF errors to force refresh next time
        cachedCsrfToken = null;
      }
      const details = payload.details && typeof payload.details === "object"
        ? (payload.details as { message?: unknown })
        : undefined;
      const detailsMessage = typeof details?.message === "string" ? details.message : undefined;
      
      // Extract nested error message for the Error constructor message (fallback used in resolveMessage)
      const nestedErrorMessage = (payload.error && typeof payload.error === 'object') 
        ? (payload.error as any).message 
        : undefined;

      const message = payload.message || nestedErrorMessage || payload.error || detailsMessage || `Request failed (${response.status})`;
      const error = new AdminApiError(String(message), response.status, payload);

      // Surface unexpected failures (5xx, network) via popup. 4xx errors are
      // expected business logic and should be handled by the calling hook.
      const isUnexpected = response.status === 0 || response.status >= 500;
      if (isUnexpected) {
        emitAdminErrorPopup(response.status, message);
      }

      throw error;
    }

    return payload;
  };

  try {
    return await makeRequest(false);
  } catch (err) {
    // Re-throw AdminApiError (already handled + popup shown inside makeRequest)
    if (err instanceof AdminApiError) throw err;
    // Network-level failure (fetch threw before receiving a response)
    const message = err instanceof Error ? err.message : "Unable to connect to server.";
    emitAdminErrorPopup(0, message, "NETWORK_FAILURE");
    throw err;
  }
}
