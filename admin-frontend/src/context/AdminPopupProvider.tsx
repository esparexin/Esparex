"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AdminPopup } from "@/components/system/AdminPopup";
import {
  PopupState,
  showAdminPopup,
  hideAdminPopup,
  subscribeAdminPopupEvents,
} from "@/lib/popup/popupEvents";

type QueuedPopup = PopupState & { count?: number };

interface AdminPopupContextValue {
  popup: PopupState | null;
  showPopup: typeof showAdminPopup;
  hidePopup: typeof hideAdminPopup;
}

const AdminPopupContext = createContext<AdminPopupContextValue | null>(null);

export function AdminPopupProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueuedPopup[]>([]);
  const [activePopup, setActivePopup] = useState<QueuedPopup | null>(null);

  const popupKey = (popup: Pick<PopupState, "type" | "title" | "message">) =>
    `${popup.type}::${popup.title}::${popup.message}`;

  const getPriority = (popup: Pick<PopupState, "type">) => {
    switch (popup.type) {
      case "error":
      case "confirm":
        return 3;
      case "warning":
        return 2;
      case "info":
        return 1;
      default:
        return 0;
    }
  };

  useEffect(() => {
    return subscribeAdminPopupEvents((nextPopup) => {
      if (!nextPopup) {
        setActivePopup(null);
        return;
      }

      if (!nextPopup.open) {
        setActivePopup((current) => {
          if (!current) return null;
          if (nextPopup.id && current.id !== nextPopup.id) return current;
          return null;
        });
        setQueue((q) =>
          nextPopup.id ? q.filter((p) => p.id !== nextPopup.id) : q
        );
        return;
      }

      setQueue((currentQueue) => {
        const incomingKey = popupKey(nextPopup);
        const activeKey = activePopup ? popupKey(activePopup) : null;

        if (incomingKey === activeKey) {
          setActivePopup((current) =>
            current ? { ...current, count: (current.count ?? 1) + 1 } : current
          );
          return currentQueue;
        }

        const existingIndex = currentQueue.findIndex(
          (p) => popupKey(p) === incomingKey
        );
        if (existingIndex >= 0) {
          return currentQueue.map((p, i) =>
            i === existingIndex ? { ...p, count: (p.count ?? 1) + 1 } : p
          );
        }

        const incoming: QueuedPopup = { ...nextPopup, count: 1 };
        const priority = getPriority(incoming);
        const insertAt = currentQueue.findIndex(
          (p) => getPriority(p) < priority
        );
        if (insertAt === -1) return [...currentQueue, incoming];
        return [
          ...currentQueue.slice(0, insertAt),
          incoming,
          ...currentQueue.slice(insertAt),
        ];
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePopup]);

  useEffect(() => {
    if (activePopup || queue.length === 0) return;
    const [next, ...rest] = queue;
    setActivePopup(next ?? null);
    setQueue(rest);
  }, [activePopup, queue]);

  const hidePopup = useCallback((id?: string) => {
    setActivePopup((current) => {
      if (!current) return null;
      if (id && current.id !== id) return current;
      return null;
    });
    hideAdminPopup(id);
  }, []);

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
