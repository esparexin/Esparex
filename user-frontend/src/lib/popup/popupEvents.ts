import { toast } from 'sonner';
import type { APIError } from "@/lib/api/APIError";
import {
  createUnifiedPopupBus,
  type PopupAction,
  type PopupState,
  type PopupType,
} from "@shared/popup/popupEvents";

const popupBus = createUnifiedPopupBus();

export type { PopupAction, PopupState, PopupType };
export const subscribePopupEvents = popupBus.subscribe;
export const showPopup = popupBus.show;
export const hidePopup = popupBus.hide;

/**
 * Emits an API error as a Sonner toast.
 * 404 → info (auto-dismiss), 400/409 → warning, all others → error (persistent).
 */
export function emitErrorPopup(error: APIError, onRetry?: () => void) {
  const message = error.message || "An unexpected error occurred.";
  const dedupeId = `api-error::${error.status}::${error.code ?? ''}::${message}`;
  const isRetryable =
    error.status === 0 || error.status >= 500 || error.status === 408 || error.status === 429;

  if (error.status === 404) {
    toast.info(message, { id: dedupeId, duration: 4000 });
    return;
  }

  if (error.status === 400 || error.status === 409) {
    toast.warning(message, { id: dedupeId, duration: Infinity });
    return;
  }

  toast.error(message, {
    id: dedupeId,
    duration: Infinity,
    ...(onRetry && isRetryable ? { action: { label: 'Retry', onClick: onRetry } } : {}),
  });
}
