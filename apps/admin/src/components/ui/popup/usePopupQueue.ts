"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { initialPopupQueueState, popupQueueReducer } from "@esparex/shared";
import { PopupState, QueuedPopup } from "@esparex/shared";

interface UsePopupQueueOptions {
    subscribe: (listener: (popup: PopupState | null) => void) => () => void;
    hideExternal: (id?: string) => void;
    onPopupRecorded?: (popup: QueuedPopup, delta: number) => void;
    deferReceive?: boolean;
}

export function usePopupQueue({
    subscribe,
    hideExternal,
    onPopupRecorded,
    deferReceive = false,
}: UsePopupQueueOptions) {
    const [{ activePopup }, dispatch] = useReducer(popupQueueReducer, initialPopupQueueState);
    const recordedCountsRef = useRef<Record<string, number>>({});

    useEffect(() => {
        let isMounted = true;
        const unsubscribe = subscribe((nextPopup) => {
            if (!deferReceive) {
                dispatch({ type: 'RECEIVE_POPUP', popup: nextPopup });
                return;
            }

            queueMicrotask(() => {
                if (isMounted) {
                    dispatch({ type: 'RECEIVE_POPUP', popup: nextPopup });
                }
            });
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [deferReceive, subscribe]);

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
            dispatch({ type: 'HIDE_POPUP', id });
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
