"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { AppPopup } from "@/components/system/AppPopup";
import { recordNotificationEvent } from "@/lib/analytics/notificationAnalytics";
import {
  PopupState,
  showPopup as emitPopupEvent,
  hidePopup as hidePopupEvent,
  subscribePopupEvents,
} from "@/lib/popup/popupEvents";

type QueuedPopup = PopupState & { count?: number };

interface PopupContextValue {
  popup: PopupState | null;
  showPopup: typeof emitPopupEvent;
  hidePopup: typeof hidePopupEvent;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueuedPopup[]>([]);
  const [activePopup, setActivePopup] = useState<QueuedPopup | null>(null);
  const recordedCountsRef = useRef<Record<string, number>>({});

  const popupKey = useCallback((popup: Pick<PopupState, "type" | "title" | "message">) => {
    return `${popup.type}::${popup.title}::${popup.message}`;
  }, []);

  const getPriority = useCallback((popup: Pick<PopupState, "type">) => {
    switch (popup.type) {
      case "error":
        return 3;
      case "warning":
        return 2;
      case "info":
        return 1;
      case "success":
        return 0;
      case "confirm":
        return 3;
      default:
        return 0;
    }
  }, []);

  useEffect(() => {
    return subscribePopupEvents((nextPopup) => {
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
        setQueue((currentQueue) =>
          nextPopup.id ? currentQueue.filter((queuedPopup) => queuedPopup.id !== nextPopup.id) : currentQueue
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
          (queuedPopup) => popupKey(queuedPopup) === incomingKey
        );

        if (existingIndex >= 0) {
          return currentQueue.map((queuedPopup, index) =>
            index === existingIndex
              ? { ...queuedPopup, count: (queuedPopup.count ?? 1) + 1 }
              : queuedPopup
          );
        }

        const normalizedIncoming: QueuedPopup = {
          ...nextPopup,
          count: 1,
        };
        const incomingPriority = getPriority(normalizedIncoming);
        const insertIndex = currentQueue.findIndex(
          (queuedPopup) => getPriority(queuedPopup) < incomingPriority
        );

        if (insertIndex === -1) {
          return [...currentQueue, normalizedIncoming];
        }

        return [
          ...currentQueue.slice(0, insertIndex),
          normalizedIncoming,
          ...currentQueue.slice(insertIndex),
        ];
      });
    });
  }, [activePopup, getPriority, popupKey]);

  useEffect(() => {
    if (activePopup || queue.length === 0) return;

    const [nextPopup, ...rest] = queue;
    setActivePopup(nextPopup ?? null);
    setQueue(rest);
  }, [activePopup, queue]);

  useEffect(() => {
    if (!activePopup?.id) return;

    const previousCount = recordedCountsRef.current[activePopup.id] ?? 0;
    const currentCount = activePopup.count ?? 1;
    const delta = currentCount - previousCount;

    if (delta <= 0) return;

    recordNotificationEvent({
      timestamp: Date.now(),
      type: activePopup.type,
      code: activePopup.code,
      message: activePopup.message,
      endpoint: activePopup.endpoint,
      source: activePopup.source,
      count: delta,
    });

    recordedCountsRef.current[activePopup.id] = currentCount;
  }, [activePopup]);

  const hidePopup = useCallback(
    (id?: string) => {
      setActivePopup((current) => {
        if (!current) return null;
        if (id && current.id !== id) return current;
        return null;
      });
      hidePopupEvent(id);
      if (id) {
        delete recordedCountsRef.current[id];
      }
    },
    []
  );

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
