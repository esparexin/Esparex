export type PopupType = "error" | "warning" | "info" | "success" | "confirm";

export interface PopupAction {
  label: string;
  action?: () => void;
  /** When true, AdminPopup disables this button during a retryAfter countdown. */
  isRetry?: boolean;
}

export interface PopupState {
  id: string;
  open: boolean;
  type: PopupType;
  title: string;
  message: string;
  code?: string;
  count?: number;
  actions?: PopupAction[];
  /** Seconds until the user may retry (for 429 rate-limit countdown). */
  retryAfter?: number;
}

type PopupListener = (popup: PopupState | null) => void;

const listeners = new Set<PopupListener>();
let lastEmission: { key: string; at: number } | null = null;

const makeId = () => `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function subscribeAdminPopupEvents(listener: PopupListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function broadcast(popup: PopupState | null) {
  listeners.forEach((listener) => listener(popup));
}

export function showAdminPopup(
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
  broadcast({ ...popup, id, open: true });
  return id;
}

export function hideAdminPopup(id?: string) {
  broadcast(
    id
      ? { id, open: false, type: "info", title: "", message: "" }
      : null
  );
}

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
