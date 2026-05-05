"use client";

import type { RenderablePopup } from "@esparex/shared";
import { PopupDialogView } from "@esparex/shared";

export function AdminPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView popup={popup} onClose={onClose} />;
}
