import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  getPopupPriority,
  popupKey,
  type PopupState,
  type QueuedPopup,
} from "@shared";

interface UsePopupQueueOptions {
  subscribe: (listener: (popup: PopupState | null) => void) => () => void;
  hideExternal: (id?: string) => void;
  onPopupRecorded?: (popup: QueuedPopup, delta: number) => void;
}

type QueueState = {
  queue: QueuedPopup[];
  activePopup: QueuedPopup | null;
};

type QueueAction =
  | { type: "RECEIVE_POPUP"; popup: PopupState | null }
  | { type: "HIDE_POPUP"; id?: string };

const promoteNextPopup = (state: QueueState): QueueState => {
  if (state.activePopup || state.queue.length === 0) return state;
  const [nextPopup, ...rest] = state.queue;
  return { activePopup: nextPopup ?? null, queue: rest };
};

const queueReducer = (state: QueueState, action: QueueAction): QueueState => {
  if (action.type === "HIDE_POPUP") {
    const shouldCloseActive =
      Boolean(state.activePopup) && (!action.id || state.activePopup?.id === action.id);
    return promoteNextPopup({
      ...state,
      activePopup: shouldCloseActive ? null : state.activePopup,
    });
  }

  const nextPopup = action.popup;
  if (!nextPopup) {
    return promoteNextPopup({ ...state, activePopup: null });
  }

  if (!nextPopup.open) {
    const shouldCloseActive =
      Boolean(state.activePopup) && (!nextPopup.id || state.activePopup?.id === nextPopup.id);
    const nextQueue = nextPopup.id
      ? state.queue.filter((queuedPopup) => queuedPopup.id !== nextPopup.id)
      : state.queue;

    return promoteNextPopup({
      activePopup: shouldCloseActive ? null : state.activePopup,
      queue: nextQueue,
    });
  }

  const incomingKey = popupKey(nextPopup);
  const activeKey = state.activePopup ? popupKey(state.activePopup) : null;

  if (incomingKey === activeKey) {
    return {
      ...state,
      activePopup: state.activePopup
        ? { ...state.activePopup, count: (state.activePopup.count ?? 1) + 1 }
        : state.activePopup,
    };
  }

  const existingIndex = state.queue.findIndex(
    (queuedPopup) => popupKey(queuedPopup) === incomingKey
  );

  if (existingIndex >= 0) {
    return {
      ...state,
      queue: state.queue.map((queuedPopup, index) =>
        index === existingIndex
          ? { ...queuedPopup, count: (queuedPopup.count ?? 1) + 1 }
          : queuedPopup
      ),
    };
  }

  const incomingPopup: QueuedPopup = { ...nextPopup, count: 1 };
  const incomingPriority = getPopupPriority(incomingPopup);
  const insertIndex = state.queue.findIndex(
    (queuedPopup) => getPopupPriority(queuedPopup) < incomingPriority
  );
  const nextQueue =
    insertIndex === -1
      ? [...state.queue, incomingPopup]
      : [
        ...state.queue.slice(0, insertIndex),
        incomingPopup,
        ...state.queue.slice(insertIndex),
      ];

  return promoteNextPopup({
    ...state,
    queue: nextQueue,
  });
};

export function usePopupQueue({
  subscribe,
  hideExternal,
  onPopupRecorded,
}: UsePopupQueueOptions) {
  const [{ activePopup }, dispatch] = useReducer(queueReducer, {
    queue: [],
    activePopup: null,
  });
  const recordedCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return subscribe((nextPopup) => {
      dispatch({ type: "RECEIVE_POPUP", popup: nextPopup });
    });
  }, [subscribe]);

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
      dispatch({ type: "HIDE_POPUP", id });
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
