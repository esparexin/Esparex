"use client";

import type { RenderablePopup } from "@/components/ui/popup/popupDialog";
import { PopupDialogView } from "@/components/ui/popup/popupDialogView";

export function AppPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView key={popup?.id ?? "idle"} popup={popup} onClose={onClose} />;
}
