import {
  createPopupBus,
  type PopupAction,
  type PopupState,
  type PopupType,
} from "./popupCore";

export type { PopupAction, PopupState, PopupType };

/**
 * Creates a standard popup bus with optional prefix.
 * Shared between frontend and admin-frontend.
 */
export function createUnifiedPopupBus(idPrefix?: string) {
  const bus = createPopupBus({ idPrefix });
  return {
    subscribe: bus.subscribe,
    show: bus.show,
    hide: bus.hide,
  };
}

/**
 * Common error popup emission logic.
 */
export function emitGenericErrorPopup(
  showFn: (popup: any, options?: any) => string,
  {
    status,
    message,
    code,
    onRetry,
  }: {
    status: number;
    message: string;
    code?: string;
    onRetry?: () => void;
  }
) {
  let type: PopupType = "error";
  if (status === 404) type = "info";
  else if (status === 400 || status === 409) type = "warning";

  const normalizedMessage = message.trim().toLowerCase();
  const fallbackTitle =
    status === 404
      ? normalizedMessage === "listing not found"
        ? "Listing unavailable"
        : "Not found"
      : type === "warning"
        ? "Warning"
        : type === "error"
          ? "Request Failed"
          : "Info";

  const isRetryable = status === 0 || status >= 500 || status === 408 || status === 429;
  const actions: PopupAction[] | undefined =
    onRetry && isRetryable
      ? [{ label: "Retry", action: onRetry, isRetry: true }, { label: "Dismiss" }]
      : [{ label: "Dismiss" }];

  return showFn(
    {
      type,
      title: code || fallbackTitle,
      message: message || "An unexpected error occurred.",
      code,
      actions,
    },
    { dedupeKey: `${type}::${code ?? status}::${message}` }
  );
}
