import { getPopupPriority, popupKey, type PopupState, type QueuedPopup } from './popupCore';

export type PopupQueueState = {
    queue: QueuedPopup[];
    activePopup: QueuedPopup | null;
};

export type PopupQueueAction =
    | { type: 'RECEIVE_POPUP'; popup: PopupState | null }
    | { type: 'HIDE_POPUP'; id?: string };

export const initialPopupQueueState: PopupQueueState = {
    queue: [],
    activePopup: null,
};

const promoteNextPopup = (state: PopupQueueState): PopupQueueState => {
    if (state.activePopup || state.queue.length === 0) return state;
    const [nextPopup, ...rest] = state.queue;
    return { activePopup: nextPopup ?? null, queue: rest };
};

export const popupQueueReducer = (
    state: PopupQueueState,
    action: PopupQueueAction
): PopupQueueState => {
    if (action.type === 'HIDE_POPUP') {
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
