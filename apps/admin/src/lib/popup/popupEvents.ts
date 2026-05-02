import {
  createUnifiedPopupBus,
  emitGenericErrorPopup,
  type PopupAction,
  type PopupState,
  type PopupType,
} from "@shared/popup/popupEvents";

const popupBus = createUnifiedPopupBus("admin");

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
  return emitGenericErrorPopup(showAdminPopup, {
    status,
    message,
    code,
    onRetry,
  });
}
