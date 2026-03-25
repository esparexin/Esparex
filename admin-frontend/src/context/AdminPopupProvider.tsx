"use client";

import { createContext, useContext, useMemo } from "react";

import { AdminPopup } from "@/components/system/AdminPopup";
import { usePopupQueue } from "@shared/popup/usePopupQueue";
import {
  PopupState,
  showAdminPopup,
  hideAdminPopup,
  subscribeAdminPopupEvents,
} from "@/lib/popup/popupEvents";

interface AdminPopupContextValue {
  popup: PopupState | null;
  showPopup: typeof showAdminPopup;
  hidePopup: typeof hideAdminPopup;
}

const AdminPopupContext = createContext<AdminPopupContextValue | null>(null);

export function AdminPopupProvider({ children }: { children: React.ReactNode }) {
  const { activePopup, hidePopup } = usePopupQueue({
    subscribe: subscribeAdminPopupEvents,
    hideExternal: hideAdminPopup,
  });

  const value = useMemo(
    () => ({
      popup: activePopup,
      showPopup: showAdminPopup,
      hidePopup,
    }),
    [activePopup, hidePopup]
  );

  return (
    <AdminPopupContext.Provider value={value}>
      {children}
      <AdminPopup
        popup={activePopup}
        onClose={() => hidePopup(activePopup?.id)}
      />
    </AdminPopupContext.Provider>
  );
}

export function useAdminPopup() {
  const context = useContext(AdminPopupContext);
  if (!context) {
    throw new Error("useAdminPopup must be used within AdminPopupProvider");
  }
  return context;
}
