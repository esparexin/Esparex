import type { APIError } from "@/lib/api/APIError";
import type { PopupAction, PopupType } from "@/lib/popup/popupEvents";

export function errorToPopup(
  error: APIError,
  onRetry?: () => void,
): {
  type: PopupType;
  title: string;
  message: string;
  code?: string;
  endpoint?: string;
  source?: string;
  retryAfter?: number;
  actions?: PopupAction[];
} {
  let type: PopupType = "error";

  if (error.status === 404) type = "info";
  else if (error.status === 400 || error.status === 409) type = "warning";
  else if (error.status >= 500 || error.status === 0) type = "error";
  else if (error.status === 401 || error.status === 403) type = "error";

  // Errors that are safe to retry
  const isRetryable =
    error.status === 0 ||      // network failure
    error.status >= 500 ||     // server error
    error.status === 408 ||    // request timeout
    error.status === 429;      // rate limited (button disabled during countdown)

  const actions: PopupAction[] | undefined =
    onRetry && isRetryable
      ? [
          { label: "Retry", action: onRetry, isRetry: true },
          { label: "Dismiss" },
        ]
      : undefined;

  return {
    type,
    title: error.code || (type === "error" ? "Request Failed" : "Notice"),
    message: error.message || "Unexpected error occurred.",
    code: error.code,
    endpoint: error.context?.endpoint,
    source: error.source,
    retryAfter: error.retryAfter,
    actions,
  };
}
