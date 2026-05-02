"use client";

import type { RenderablePopup } from "@shared/popup/popupDialog";
import { PopupDialogView } from "@shared/popup/popupDialogView";

export function AdminPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView popup={popup} onClose={onClose} />;
}
