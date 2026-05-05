"use client";

import type { RenderablePopup } from "@/components/ui/popup/popupDialog";
import { PopupDialogView } from "@/components/ui/popup/popupDialogView";

export function AdminPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView popup={popup} onClose={onClose} />;
}
