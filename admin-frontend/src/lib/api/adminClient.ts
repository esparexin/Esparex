import type { AdminEnvelope } from "@/types/admin";
import {
  ADMIN_API_V1_BASE_PATH,
  ADMIN_ROUTES,
  DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

const rawBase =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  `${DEFAULT_LOCAL_API_ORIGIN}${ADMIN_API_V1_BASE_PATH}`;
const ADMIN_API_BASE = rawBase.replace(/\/$/, "");

if (!ADMIN_API_BASE.startsWith("http")) {
  throw new Error("ADMIN_API_BASE misconfigured. Check NEXT_PUBLIC_ADMIN_API_URL.");
}

let cachedCsrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  const response = await fetch(`${ADMIN_API_BASE}${ADMIN_ROUTES.CSRF_TOKEN}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

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

export async function adminFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<AdminEnvelope<T>> {
  const makeRequest = async (csrfRetry: boolean): Promise<AdminEnvelope<T>> => {
  const url = `${ADMIN_API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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

  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    cache: "no-store",
    ...options,
    headers,
    body:
      options.body === undefined || options.body instanceof FormData
        ? (options.body as BodyInit | undefined)
        : JSON.stringify(options.body)
  });

  const payload = (await response.json().catch(() => ({}))) as AdminEnvelope<T>;

  if (!response.ok) {
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
    const message = payload.message || payload.error || `Request failed (${response.status})`;
    class AdminApiError extends Error {
      status: number;
      payload: AdminEnvelope<T>;
      constructor(message: string, status: number, payload: AdminEnvelope<T>) {
        super(message);
        this.status = status;
        this.payload = payload;
      }
    }
    throw new AdminApiError(message, response.status, payload);
  }

  return payload;
  };

  return makeRequest(false);
}
