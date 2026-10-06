/**
 * @deprecated Canonical notification module is `createNotify` in `@esparex/shared`
 * (P1-2 — single shared `notify` per DECISION-GATE §3).
 *
 * This module is a compatibility shim that wires the shared implementation to
 * the admin popup bus. It will be deleted in Phase 4. New code should
 * `import { createNotify } from "@esparex/shared"` and wire its own bus.
 */
import { createNotify } from "@esparex/shared";
import { showAdminPopup } from "./popup/popupEvents";
import { mapErrorToMessage as mapAdminErrorToMessage } from "./mapErrorToMessage";

export const notify = createNotify({
  show: showAdminPopup,
  // The admin mapper requires a fallback; the shared facade may call it
  // without one (object-options branch). Preserve the legacy behavior exactly:
  // the admin fork always forwarded "An unexpected error occurred." here.
  mapErrorToMessage: (error: unknown, fallback?: string) =>
    mapAdminErrorToMessage(error, fallback ?? "An unexpected error occurred."),
});
