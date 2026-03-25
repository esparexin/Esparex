import type { APIError } from "@/lib/api/APIError";
import { errorToPopup } from "@/lib/errors/errorToPopup";
import {
  createPopupBus,
  type PopupAction,
  type PopupState,
  type PopupType,
} from "@shared/popup/popupCore";

const popupBus = createPopupBus();

export type { PopupAction, PopupState, PopupType };
export const subscribePopupEvents = popupBus.subscribe;
export const showPopup = popupBus.show;
export const hidePopup = popupBus.hide;

export function emitErrorPopup(error: APIError, onRetry?: () => void) {
  const popup = errorToPopup(error, onRetry);
  return showPopup(popup, {
    dedupeKey: `${popup.type}::${error.code ?? error.status}::${popup.message}`,
  });
}
