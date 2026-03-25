export type PopupType = "error" | "warning" | "info" | "success" | "confirm";

export interface PopupAction {
  label: string;
  action?: () => void;
  isRetry?: boolean;
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
  retryAfter?: number;
}

export type PopupListener = (popup: PopupState | null) => void;
export type QueuedPopup = PopupState & { count?: number };

export function popupKey(popup: Pick<PopupState, "type" | "title" | "message">) {
  return `${popup.type}::${popup.title}::${popup.message}`;
}

export function getPopupPriority(popup: Pick<PopupState, "type">) {
  switch (popup.type) {
    case "error":
    case "confirm":
      return 3;
    case "warning":
      return 2;
    case "info":
      return 1;
    default:
      return 0;
  }
}

interface PopupBusOptions {
  idPrefix?: string;
}

interface PopupBus {
  subscribe: (listener: PopupListener) => () => void;
  show: (
    popup: Omit<PopupState, "id" | "open"> & { id?: string },
    options?: { dedupeKey?: string; dedupeMs?: number }
  ) => string;
  hide: (id?: string) => void;
}

export function createPopupBus({ idPrefix = "" }: PopupBusOptions = {}): PopupBus {
  const listeners = new Set<PopupListener>();
  let lastEmission: { key: string; at: number } | null = null;

  const makeId = () => {
    const random = Math.random().toString(36).slice(2, 8);
    return idPrefix ? `${idPrefix}-${Date.now()}-${random}` : `${Date.now()}-${random}`;
  };

  const broadcast = (popup: PopupState | null) => {
    listeners.forEach((listener) => listener(popup));
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    show(popup, options) {
      const dedupeKey = options?.dedupeKey ?? popupKey(popup);
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
    },
    hide(id) {
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
    },
  };
}
