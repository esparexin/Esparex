"use client";

import type { RenderablePopup } from "@esparex/ui";
import { PopupDialogView } from "@esparex/ui";

export function AppPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView key={popup?.id ?? "idle"} popup={popup} onClose={onClose} />;
}
