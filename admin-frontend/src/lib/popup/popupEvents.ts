import {
  createPopupBus,
  type PopupAction,
  type PopupState,
  type PopupType,
} from "@shared/popup/popupCore";

const popupBus = createPopupBus({ idPrefix: "admin" });

export type { PopupAction, PopupState, PopupType };
export const subscribeAdminPopupEvents = popupBus.subscribe;
export const showAdminPopup = popupBus.show;
export const hideAdminPopup = popupBus.hide;

/** Maps an AdminApiError status to a popup for unexpected failures (5xx, network). */
export function emitAdminErrorPopup(
  status: number,
  message: string,
  code?: string,
  onRetry?: () => void,
) {
  let type: PopupType = "error";
  if (status === 404) type = "info";
  else if (status === 400 || status === 409) type = "warning";

  const isRetryable = status === 0 || status >= 500 || status === 408 || status === 429;
  const actions: PopupAction[] | undefined =
    onRetry && isRetryable
      ? [{ label: "Retry", action: onRetry, isRetry: true }, { label: "Dismiss" }]
      : undefined;

  return showAdminPopup(
    {
      type,
      title: code || (type === "error" ? "Request Failed" : "Notice"),
      message: message || "An unexpected error occurred.",
      code,
      ...(actions ? { actions } : {}),
    },
    { dedupeKey: `${type}::${code ?? status}::${message}` },
  );
}
