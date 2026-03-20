import type { APIError } from "@/lib/api/APIError";
import { errorToPopup } from "@/lib/errors/errorToPopup";

export type PopupType = "error" | "warning" | "info" | "success" | "confirm";

export interface PopupAction {
  label: string;
  action?: () => void;
}

export interface PopupState {
  id: string;
  open: boolean;
  type: PopupType;
  title: string;
  message: string;
  code?: string;
  endpoint?: string;
  source?: string;
  count?: number;
  actions?: PopupAction[];
}

type PopupListener = (popup: PopupState | null) => void;

const listeners = new Set<PopupListener>();
let lastEmission: { key: string; at: number } | null = null;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function subscribePopupEvents(listener: PopupListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function broadcast(popup: PopupState | null) {
  listeners.forEach((listener) => listener(popup));
}

export function showPopup(
  popup: Omit<PopupState, "id" | "open"> & { id?: string },
  options?: { dedupeKey?: string; dedupeMs?: number }
) {
  const dedupeKey =
    options?.dedupeKey ?? `${popup.type}::${popup.title}::${popup.message}`;
  const dedupeMs = options?.dedupeMs ?? 600;
  const now = Date.now();

  if (
    lastEmission &&
    lastEmission.key === dedupeKey &&
    now - lastEmission.at < dedupeMs
  ) {
    return lastEmission.key;
  }

  lastEmission = { key: dedupeKey, at: now };

  const id = popup.id ?? makeId();
  broadcast({
    ...popup,
    id,
    open: true,
  });
  return id;
}

export function hidePopup(id?: string) {
  broadcast(
    id
      ? {
          id,
          open: false,
          type: "info",
          title: "",
          message: "",
        }
      : null
  );
}

export function emitErrorPopup(error: APIError) {
  const popup = errorToPopup(error);
  return showPopup(popup, {
    dedupeKey: `${popup.type}::${error.code ?? error.status}::${popup.message}`,
  });
}
