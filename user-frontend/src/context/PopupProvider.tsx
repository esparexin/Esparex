"use client";

import { createContext, useContext, useMemo } from "react";

import { AppPopup } from "@/components/system/AppPopup";
import { recordNotificationEvent } from "@/lib/analytics/notificationAnalytics";
import { usePopupQueue } from "@shared/popup/usePopupQueue";
import {
  PopupState,
  showPopup as emitPopupEvent,
  hidePopup as hidePopupEvent,
  subscribePopupEvents,
} from "@/lib/popup/popupEvents";

interface PopupContextValue {
  popup: PopupState | null;
  showPopup: typeof emitPopupEvent;
  hidePopup: typeof hidePopupEvent;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const { activePopup, hidePopup } = usePopupQueue({
    subscribe: subscribePopupEvents,
    hideExternal: hidePopupEvent,
    onPopupRecorded: (popup, delta) => {
      recordNotificationEvent({
        timestamp: Date.now(),
        type: popup.type,
        code: popup.code,
        message: popup.message,
        endpoint: popup.endpoint,
        source: popup.source,
        count: delta,
      });
    },
  });

  const value = useMemo(
    () => ({
      popup: activePopup,
      showPopup: emitPopupEvent,
      hidePopup,
    }),
    [activePopup, hidePopup]
  );

  return (
    <PopupContext.Provider value={value}>
      {children}
      <AppPopup popup={activePopup} onClose={() => hidePopup(activePopup?.id)} />
    </PopupContext.Provider>
  );
}

export function usePopupContext() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopupContext must be used within PopupProvider");
  }
  return context;
}
