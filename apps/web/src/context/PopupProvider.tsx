"use client";

import { createContext, useContext, useEffect, useMemo } from "react";

import { AppPopup } from "@/components/system/AppPopup";
import { recordNotificationEvent } from "@/lib/analytics/notificationAnalytics";
import { usePopupQueue } from "@esparex/ui";
import { notify } from "@/lib/feedback";
import {
  emitPopupEvent,
  hidePopupEvent,
  subscribePopupEvents,
} from "@/lib/popup";
import type { PopupState } from "@esparex/shared";


interface PopupContextValue {
  popup: PopupState | null;
  showPopup: typeof emitPopupEvent;
  hidePopup: typeof hidePopupEvent;
  notify: typeof notify;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__esparex_notify = notify;
      (window as any).__esparex_emitPopup = emitPopupEvent;
    }
  }, []);

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
      notify,
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
