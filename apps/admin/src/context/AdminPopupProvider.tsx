"use client";

import { AdminPopup } from "@/components/system/AdminPopup";
import { usePopupQueue } from "@esparex/ui";
import {
  hideAdminPopup,
  subscribeAdminPopupEvents,
} from "@/lib/popup/popupEvents";

export function AdminPopupProvider({ children }: { children: React.ReactNode }) {
  const { activePopup, hidePopup } = usePopupQueue({
    subscribe: subscribeAdminPopupEvents,
    hideExternal: hideAdminPopup,
  });

  return (
    <>
      {children}
      <AdminPopup
        popup={activePopup}
        onClose={() => hidePopup(activePopup?.id)}
      />
    </>
  );
}
