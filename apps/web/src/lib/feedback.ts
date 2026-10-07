/**
 * @deprecated Canonical notification module is `createNotify` in `@esparex/shared`
 * (P1-2 — single shared `notify` per DECISION-GATE §3).
 *
 * This module is a compatibility shim that wires the shared implementation to
 * the web popup bus. It will be deleted in Phase 4. New code should
 * `import { createNotify } from "@esparex/shared"` and wire its own bus.
 */
import { createNotify } from "@esparex/shared";
import { mapErrorToMessage } from "@/lib/errorMapper";
import logger from "@/lib/logger";
import { popupBus } from "@/lib/popup";

export const notify = createNotify({
    show: popupBus.show,
    mapErrorToMessage,
    log: logger,
});

declare global {
    interface Window {
        __esparex_notify?: typeof notify;
    }
}

if (typeof window !== "undefined") {
    window.__esparex_notify = notify;
}
