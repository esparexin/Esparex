"use client";

import type { RenderablePopup } from "@esparex/ui";
import { PopupDialogView } from "@esparex/ui";

// Canonical popupBus renderer — mounted once by PopupProvider. Part of the
// popupBus/notify SSOT (not a competing system). Audit Phase 3: keep.
export function AppPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView key={popup?.id ?? "idle"} popup={popup} onClose={onClose} />;
}
