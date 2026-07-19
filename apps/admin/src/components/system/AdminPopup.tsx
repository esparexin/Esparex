"use client";

import type { RenderablePopup } from "@esparex/ui";
import { PopupDialogView } from "@esparex/ui";

export function AdminPopup({
  popup,
  onClose,
}: {
  popup: RenderablePopup | null;
  onClose: () => void;
}) {
  return <PopupDialogView popup={popup} onClose={onClose} />;
}
