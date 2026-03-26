import type { APIError } from "@/lib/api/APIError";
import {
  createUnifiedPopupBus,
  emitGenericErrorPopup,
  type PopupAction,
  type PopupState,
  type PopupType,
} from "@shared/popup/popupEvents";

const popupBus = createUnifiedPopupBus();

export type { PopupAction, PopupState, PopupType };
export const subscribePopupEvents = popupBus.subscribe;
export const showPopup = popupBus.show;
export const hidePopup = popupBus.hide;

export function emitErrorPopup(error: APIError, onRetry?: () => void) {
  return emitGenericErrorPopup(showPopup, {
    status: error.status,
    message: error.message,
    code: error.code,
    onRetry,
  });
}
