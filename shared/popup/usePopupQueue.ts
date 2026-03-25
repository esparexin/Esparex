import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getPopupPriority,
  popupKey,
  type PopupState,
  type QueuedPopup,
} from "./popupCore";

interface UsePopupQueueOptions {
  subscribe: (listener: (popup: PopupState | null) => void) => () => void;
  hideExternal: (id?: string) => void;
  onPopupRecorded?: (popup: QueuedPopup, delta: number) => void;
}

export function usePopupQueue({
  subscribe,
  hideExternal,
  onPopupRecorded,
}: UsePopupQueueOptions) {
  const [queue, setQueue] = useState<QueuedPopup[]>([]);
  const [activePopup, setActivePopup] = useState<QueuedPopup | null>(null);
  const recordedCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return subscribe((nextPopup) => {
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
          nextPopup.id
            ? currentQueue.filter((queuedPopup) => queuedPopup.id !== nextPopup.id)
            : currentQueue
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

        const incomingPopup: QueuedPopup = {
          ...nextPopup,
          count: 1,
        };
        const incomingPriority = getPopupPriority(incomingPopup);
        const insertIndex = currentQueue.findIndex(
          (queuedPopup) => getPopupPriority(queuedPopup) < incomingPriority
        );

        if (insertIndex === -1) {
          return [...currentQueue, incomingPopup];
        }

        return [
          ...currentQueue.slice(0, insertIndex),
          incomingPopup,
          ...currentQueue.slice(insertIndex),
        ];
      });
    });
  }, [activePopup, subscribe]);

  useEffect(() => {
    if (activePopup || queue.length === 0) return;

    const [nextPopup, ...rest] = queue;
    setActivePopup(nextPopup ?? null);
    setQueue(rest);
  }, [activePopup, queue]);

  useEffect(() => {
    if (!activePopup?.id || !onPopupRecorded) return;

    const previousCount = recordedCountsRef.current[activePopup.id] ?? 0;
    const currentCount = activePopup.count ?? 1;
    const delta = currentCount - previousCount;

    if (delta <= 0) return;

    onPopupRecorded(activePopup, delta);
    recordedCountsRef.current[activePopup.id] = currentCount;
  }, [activePopup, onPopupRecorded]);

  const hidePopup = useCallback(
    (id?: string) => {
      setActivePopup((current) => {
        if (!current) return null;
        if (id && current.id !== id) return current;
        return null;
      });
      hideExternal(id);
      if (id) {
        delete recordedCountsRef.current[id];
      }
    },
    [hideExternal]
  );

  return useMemo(
    () => ({
      activePopup,
      hidePopup,
    }),
    [activePopup, hidePopup]
  );
}
