"use client";

import { usePopupContext } from "@/context/PopupProvider";

export function usePopup() {
  return usePopupContext();
}
